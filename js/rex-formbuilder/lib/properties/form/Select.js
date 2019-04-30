/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactCreateClass = require('create-react-class');
var PropTypes = require('prop-types');


var Select = ReactCreateClass({
  propTypes: {
    choices: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        label: PropTypes.string.isRequired
      })
    ).isRequired
  },

  buildChoices: function (choices) {
    choices = choices || [];
    return choices.map(function (choice, index) {
      return (
        <option
          key={index}
          value={choice.value}>
          {choice.label}
        </option>
      );
    });
  },

  render: function () {
    var choices = this.buildChoices(this.props.choices);

    return (
      <select
        value={this.props.value}
        onChange={this.props.onChange}
        id={this.props.id || this.props.name}>
        {choices}
      </select>
    );
  }
});


module.exports = Select;

