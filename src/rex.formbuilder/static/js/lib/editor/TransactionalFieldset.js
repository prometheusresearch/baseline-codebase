/**
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var Reflux                = require('reflux');
var ReactForms            = require('react-forms');
var Value                 = require('react-forms/lib/Value');
var Icon                  = require('../Icon');
var ReadOnlyFieldset      = require('../ReadOnlyFieldset');
var EditTransactionStore  = require('./EditTransactionStore');
var Actions               = require('./Actions');

function firstScalarKeyPath(node) {
  var keyPath = [];
  while (!(node instanceof ReactForms.schema.ScalarNode)) {
    var nextKey = node.children.keySeq().first();
    keyPath = keyPath.concat(nextKey);
    node = node.children.get(nextKey);
  }
  return keyPath;
}

var TransactionalFieldsetToolbar = React.createClass({

  render() {
    var {value: {isValid, hasDirty}, className, ...props} = this.props;
    var showInvalid = !isValid && hasDirty;
    var classNames = cx({
      'rfb-TransactionalFieldsetToolbar': true,
      'rfb-TransactionalFieldsetToolbar--invalid': showInvalid
    });
    return (
      <div {...props} className={cx(classNames, className)}>
        <button
          disabled={showInvalid}
          className="rfb-TransactionalFieldsetToolbar__save"
          onClick={this.onSave}>
          Save
        </button>
        {!this.props.disableCancel &&
          <button
            className="rfb-TransactionalFieldsetToolbar__cancel"
            onClick={this.onCancel}>
            Cancel
          </button>}
        <span className="rfb-TransactionalFieldsetToolbar__tip">
          {showInvalid ?
            <span>Fix all errors before saving changes</span> :
            <span>Press <b>Ctrl+Enter</b> to save changes</span>}
        </span>
      </div>
    );
  },

  onSave(e) {
    e.preventDefault();
    this.props.onSave();
  },

  onCancel(e) {
    e.preventDefault();
    this.props.onCancel();
  }
});

var TransactionalFieldset = React.createClass({

  mixins: [
    Reflux.connect(EditTransactionStore, 'editTransaction'),
    ReactForms.FocusStore.ScopeMixin
  ],

  render() {
    var {className, value, ...props} = this.props;
    var {value, editTransaction} = this.state;
    var editable = editTransaction.isEditable(this.props.value.keyPath);
    var classNames = cx({
      'rfb-TransactionalFieldset': true,
      'rfb-TransactionalFieldset--editable': editable,
      'rfb-TransactionalFieldset--invalid': value && !value.isValid
    });
    return (
      <div {...props} className={cx(classNames, className)}>
        {editable ? this.renderEditable() : this.renderReadOnly()}
      </div>
    );
  },

  renderEditable() {
    var value = this.getValue();
    return (
      <div
        onKeyDown={this.onKeyDown}
        className="rfb-TransactionalFieldset__editablePane">
        <TransactionalFieldsetToolbar
          className="rfb-TransactionalFieldset__toolbar"
          value={value}
          disableCancel={!this.props.value.isValid}
          onSave={this.save}
          onCancel={this.cancel}
          />
        <ReadOnlyFieldset
          className="rfb-TransactionalFieldset__fieldset"
          editable
          onClick={this.edit}
          value={value}
          />
        <TransactionalFieldsetToolbar
          className="rfb-TransactionalFieldset__toolbar"
          value={value}
          disableCancel={!this.props.value.isValid}
          onSave={this.save}
          onCancel={this.cancel}
          />
      </div>
    );
  },

  renderReadOnly() {
    var {value} = this.props;
    return (
      <div className="rfb-TransactionalFieldset__readOnlyPane">
        <button
          type="button"
          onClick={this.onEdit}
          className="rfb-TransactionalFieldset__editButton">
          <Icon name="edit" /> Edit
        </button>
        <ReadOnlyFieldset onClick={this.edit} value={value} />
      </div>
    );
  },

  getInitialState() {
    return {
      value: null
    }; 
  },

  componentDidUpdate(_prevProps, prevState) {
    var keyPath = this.props.value.keyPath;
    var wasEditable = prevState.editTransaction.isEditable(keyPath);
    if (!wasEditable) {
      this.ensureFocus();
    }
  },

  componentDidMount() {
    this.ensureFocus();
  },

  ensureFocus() {
    var keyPath = this.props.value.keyPath;
    var isEditable = this.state.editTransaction.isEditable(keyPath);
    if (isEditable) {
      var focusKeyPath = this.state.editTransaction.getTransaction(keyPath);
      if (!focusKeyPath) {
        focusKeyPath = firstScalarKeyPath(this.getValue().node);
      }
      this.focusElement(focusKeyPath);
    }
  },

  onEdit() {
    this.edit();
  },

  edit(initiatorKeyPath) {
    // we convert global initiatorKeyPath into local one by substracting own
    // keyPath
    if (initiatorKeyPath) {
      initiatorKeyPath = initiatorKeyPath.slice(this.props.value.keyPath.length);
    }
    var value = this.getValue();
    Actions.transactionStarted(this.props.value.keyPath, initiatorKeyPath);
    this.setState({value});
  },

  save() {
    var value = this.getValue();
    if (value.isValid) {
      Actions.transactionCommitted(this.props.value.keyPath);
      this.props.value.set(this.getValue().value);
      this.setState({value: null});
    } else {
      value.makeDirty();
    }
  },

  cancel() {
    Actions.transactionRolledBack(this.props.value.keyPath);
    this.setState({value: null});
  },

  onValue(value) {
    this.setState({value});
  },

  getValue() {
    var {value: val} = this.props;
    return this.state.value || Value.create(
      val.abstractNode,
      val.value,
      this.onValue,
      this.getValue,
      this
    );
  },

  onKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.stopPropagation();
      this.save();
    }
  }
});

module.exports = TransactionalFieldset;
