/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');


var Select = React.createClass({
  propTypes: {
    choices: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        value: React.PropTypes.any.isRequired,
        label: React.PropTypes.string.isRequired
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

