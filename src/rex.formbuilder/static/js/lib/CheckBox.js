/**
 * Checkbox input component.
 *
 * @jsx React.DOM
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React         = require('react');
var emptyFunction = require('./emptyFunction');

var CheckBox = React.createClass({

  render() {
    var {value, ...props} = this.props;
    return (
      <input
        {...props}
        type="checkbox"
        className="rfb-CheckBox"
        checked={value}
        onChange={this.onChange}
        />
    );
  },

  getDefaultProps() {
    return {
      value: false,
      onChange: emptyFunction
    };
  },

  onChange(e) {
    var value = e.target.checked ? true : false;
    this.props.onChange(value);
  }
});

module.exports = CheckBox;
