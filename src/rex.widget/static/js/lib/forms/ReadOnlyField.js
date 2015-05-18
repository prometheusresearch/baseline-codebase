/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../Layout');
var emptyFunction = require('../emptyFunction');

var ReadOnlyFieldStyle = {
  self: {
    marginBottom: 7,
    marginTop: 8
  },
  label: {
    marginRight: 10,
    color: '#888',
    fontWeight: 'bold'
  }
};

var ReadOnlyField = React.createClass({

  render() {
    var {label, style, renderValue} = this.props;
    var {value} = this.props.formValue;
    return (
      <HBox style={{...ReadOnlyFieldStyle.self, ...(style && style.self)}}>
        <div style={{...ReadOnlyFieldStyle.label, ...(style && style.label)}}>{label}:</div>
        <div>{renderValue(value)}</div>
      </HBox>
    );
  },

  getDefaultProps() {
    return {
      renderValue: renderValue
    };
  }
});

function renderValue(value) {
  if (value == null) {
    return value;
  }
  return String(value);
}

module.exports = ReadOnlyField;
