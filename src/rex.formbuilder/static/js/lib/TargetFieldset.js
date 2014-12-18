/**
 * @jsx React.DOM
 */
'use strict';

var Immutable   = require('immutable');
var React       = require('react');
var ReactForms  = require('react-forms');
var Button      = require('./Button');
var FormHelpers = require('./FormHelpers');
var cx          = React.addons.classSet;
var countKeys   = require('./countKeys');

var TargetItem = React.createClass({

  render() {
    var value = this.props.value;
    var idInvalid = (FormHelpers.validateIdentifier(value) instanceof Error);
    var idCls = {
      'rf-Field': true,
      'rfb-TargetItem__identifier': true,
      'rf-Field--invalid': idInvalid
    };
    return (
      <div className="rfb-TargetItem">
        <div className={cx(idCls)}>
          <input
            type="text"
            value={value}
            ref="input"
            placeholder="Identifier"
            onChange={this.handleChange}
            />
        </div>
        <div className="rf-Field rfb-TargetItem__delete">
          <Button onClick={this.triggerDelete}>&times;</Button>
        </div>
      </div>
    );
  },

  getValue: function () {
    return this.refs.input.value;
  },

  triggerDelete() {
    if (this.props.onDelete) {
      this.props.onDelete();
    }
  },

  triggerChange() {
    if (this.props.onChange) {
      this.props.onChange({
        id: this.state.id,
        description: this.state.description
      });
    }
  },

  handleChange(ev) {
    this.props.onChange(ev.target.value);
  },
});


var TargetFieldset = React.createClass({

  render() {
    var label = this.props.label || this.props.value.schema.props.get('label');
    var total = countKeys(this.state.items);
    var addButton = (
      <Button className="rfb-TargetFieldset__add"
              onClick={this.add}>Add Target</Button>
    );
    var listCls = {
      'rfb-TargetFieldset__list': true,
      'rfb-TargetFieldset__list--empty': total == 0
    };
    return (
      <div className="rfb-TargetFieldset">
        <div className="rfb-TargetFieldset__header">
          {(total == 0) &&
            <div className="rfb-TargetFieldset__header__add">
              {addButton}
            </div>}
          <div className="rfb-TargetFieldset__header__label">
            <label className="rf-Label rf-Field__label">{label}</label>
          </div>
        </div>
        <div className={cx(listCls)}>
          {total == 0 ?
            'No Items' : <this.renderItems />}
        </div>
        {(total != 0) &&
          <div className="rfb-TargetFieldset__footer">
            {addButton}
          </div>}
      </div>
    );
  },

  renderItems() {
    return this.state.items.map((value, idx) => {
      return (
        <TargetItem
          key={idx}
          value={value}
          onChange={this.handleChange.bind(this, idx)}
          onDelete={this.handleDelete.bind(this, idx)}
          />
      );
    });
  },

  getInitialState() {
    var value = this.props.value.value;
    var items = value ? value.toJS() : [];
    return {items};
  },

  valueChanged() {
    var items = this.state.items;
    var value = Immutable.fromJS(this.state.items);
    this.props.value.update(value).notify();
  },

  handleChange(idx, targetItem) {
    var items = this.state.items.slice(0);
    items[idx] = targetItem;
    this.setState({items}, this.valueChanged);
  },

  handleDelete(idx) {
    var items = this.state.items.slice(0);
    items.splice(idx, 1);
    this.setState({items}, this.valueChanged);
  },

  add() {
    var items = this.state.items.slice(0);
    items.push('');
    this.setState({items}, this.valueChanged);
  }
});


module.exports = TargetFieldset;
