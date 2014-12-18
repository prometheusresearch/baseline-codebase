/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var Select = require('./Select');

var AddlResponseSelect = React.createClass({
  propTypes: {
    value: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number
    ]),
    onChange: React.PropTypes.func
  },

  options: [
    {
        id: 'none',
        title: 'Not Allowed'
    },
    {
        id: 'optional',
        title: 'Optional'
    },
    {
        id: 'required',
        title: 'Required'
    }
  ],

  render: function() {
    return this.transferPropsTo(
      <Select options={this.options} emptyValue={null} />
    );
  }
});

module.exports = AddlResponseSelect;
