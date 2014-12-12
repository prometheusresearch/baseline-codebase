/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react/addons');
var cx          = React.addons.classSet;
var ReactForms  = require('react-forms');
var ReadOnlyField = require('./ReadOnlyField');

var ReadOnlyField = React.createClass({

  mixins: [ReactForms.FocusStore.FocusableMixin],

  render() {
    var {value: {value, node}, className, ...props} = this.props;
    return (
      <div {...props}
        className={cx('rfb-ReadOnlyField', className)}
        onClick={this.onClick}>
        <div className="rfb-ReadOnlyField__label">
          {node.props.get('label')}
        </div>
        {value != null ?
          <div className="rfb-ReadOnlyField__value">
            {value}
          </div> :
          <div className="rfb-ReadOnlyField__noValue">
            no value
          </div>}
      </div>
    );
  },

  onClick() {
    this.props.onClick(this.props.value.keyPath);
  }
});

var ReadOnlyFieldset = React.createClass({

  render() {
    var {onClick, editable, value, label, hint, className, ...props} = this.props;
    var classNames = cx({
      'rfb-ReadOnlyFieldset': true,
      'rfb-ReadOnlyFieldset--readOnly': !editable,
      'rfb-ReadOnlyFieldset--editable': editable
    });
    return (
      <div {...props} className={cx(classNames, className)}>
        <ReactForms.Label
          className="rfb-ReadOnlyFieldset__label"
          label={label || value.node.props.get('label')}
          hint={hint || value.node.props.get('hint')}
          />
        {value.map(this.renderField)}
      </div>
    );
  },

  renderField(value) {
    var readOnly = value.node.props.get('transactionalField', false) && !this.props.editable;
    if (readOnly) {
      if (value.is(ReactForms.schema.ScalarNode)) {
        return (
          <ReadOnlyField
            key={value.key}
            className="rfb-ReadOnlyFieldset__readOnlyField"
            onClick={this.props.onClick}
            value={value}
            />
        );
      } else {
        return (
          <ReadOnlyFieldset
            key={value.key}
            editable={this.props.editable}
            onClick={this.props.onClick}
            value={value}
            />
        );
      }
    } else {
      return (
        <ReactForms.Element
          key={value.key}
          editable={this.props.editable}
          className="rfb-ReadOnlyFieldset__field"
          value={value}
          />
      );
    }
  },

  getDefaultProps() {
    return {
      editable: false
    };
  }
});

module.exports = ReadOnlyFieldset;
