/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var Select = require('./Select');

var types = [
  'hide',
  'disable',
  'hideEnumeration',
  'fail',
  'calculate'
];

var EventTypeSelect = React.createClass({
  propTypes: {
    value: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number
    ]),
    onChange: React.PropTypes.func
  },

  render: function() {
    var options = types.map((type) => {
      return {
        id: type,
        title: type
      };
    });

    return this.transferPropsTo(
      <Select options={options} emptyValue={null} />
    );
  }
});


module.exports = EventTypeSelect;

