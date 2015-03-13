/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../Layout');

var ReadOnlyFieldStyle = {
  self: {
    marginBottom: 5
  },
  label: {
    marginRight: 10,
    color: '#888',
    fontWeight: 'bold'
  }
};

var ReadOnlyField = React.createClass({

  render() {
    var {label} = this.props;
    var {value} = this.props.formValue;
    return (
      <HBox style={ReadOnlyFieldStyle.self}>
        <div style={ReadOnlyFieldStyle.label}>{label}:</div>
        <div>{value}</div>
      </HBox>
    );
  }
});

module.exports = ReadOnlyField;
