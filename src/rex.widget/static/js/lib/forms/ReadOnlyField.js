/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../Layout');
var emptyFunction = require('../emptyFunction');

var Style = {
  self: {
    marginBottom: 2,
    marginTop: 2,
    fontSize: '90%'
  },
  label: {
    textAlign: 'right',
    color: '#666',
    padding: '2px 7px',
    margin: 0
  }
};

var ReadOnlyField = React.createClass({

  render() {
    var {label, style, renderValue, formValue, children, labelSize, inputSize} = this.props;
    if (children === undefined) {
      children = renderValue(formValue.value);
    }
    return (
      <HBox style={{...Style.self, ...(style && style.self)}}>
        {label &&
          <VBox size={labelSize} centerVertically>
            <label style={{...Style.label, ...(style && style.label)}}>
              {label}
            </label>
          </VBox>}
        <VBox size={inputSize} centerVertically>
          {children}
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
  } else if (value.type && value.props) {
    return value;
  } else {
    return String(value);
  }
}

module.exports = ReadOnlyField;
