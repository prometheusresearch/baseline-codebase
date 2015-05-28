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
    marginTop: 8,
    fontSize: '90%'
  },
  label: {
    textAlign: 'right',
    color: '#666',
    padding: '7px 7px',
    margin: 0
  }
};

var ReadOnlyField = React.createClass({

  render() {
    var {label, style, renderValue, labelSize, inputSize} = this.props;
    var {value} = this.props.formValue;
    return (
      <HBox style={{...ReadOnlyFieldStyle.self, ...(style && style.self)}}>
        {label && 
          <VBox size={labelSize} centerVertically>
            <label style={{...ReadOnlyFieldStyle.label, ...(style && style.label)}}>
              {label}
            </label>
          </VBox>}
        <VBox size={inputSize} centerVertically>
          {renderValue(value)}
        </VBox>
      </HBox>
    );
  },

  getDefaultProps() {
    return {
      renderValue: renderValue,
      labelSize: 2,
      inputSize: 5
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
