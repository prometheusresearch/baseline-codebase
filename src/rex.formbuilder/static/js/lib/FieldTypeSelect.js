/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var Select = require('./Select');

var SIMPLE_INSTRUMENT_BASE_TYPES = [
  'float',
  'integer',
  'text',
  'enumeration',
  'enumerationSet',
  'boolean',
  'date',
  'time',
  'dateTime'
];

var COMPLEX_INSTRUMENT_BASE_TYPES = [
  'recordList',
  'matrix'
];

var FieldTypeSelect = React.createClass({
  propTypes: {
    value: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number
    ]),
    onChange: React.PropTypes.func
  },

  render: function() {
    var types = SIMPLE_INSTRUMENT_BASE_TYPES;
    if (this.props.allowComplexTypes) {
      types = types.concat(COMPLEX_INSTRUMENT_BASE_TYPES);
    }

    var options = types.map((type) => {
      return {
        id: type,
        title: type
      };
    });

    return this.transferPropsTo(
      <Select
        options={options}
        emptyValue={null}
        onChange={this.onChange}
        />
    );
  },

  onChange(value) {
    if (this.props.coerceComplexTypes &&
        COMPLEX_INSTRUMENT_BASE_TYPES.indexOf(value) > -1) {
      value = {base: value};
    }
    this.props.onChange(value);
  }
});


module.exports = FieldTypeSelect;

