/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');

var NavigationButton = React.createClass({

  propTypes: {
    label: React.PropTypes.string.isRequired
  },

  focus: function () {
    this.getDOMNode().focus();
  },

  render: function() {
    return this.transferPropsTo(
      <button
        className="rex-forms-NavigationButton"
        onClick={this.props.onClick}>
        {this.props.label}
      </button>
    );
  }
});

module.exports = NavigationButton;
