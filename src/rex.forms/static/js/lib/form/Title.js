/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var localized = require('../localized');

var Title = React.createClass({

  propTypes: {
    text: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.object
    ])
  },

  render: function () {
    return (
      <localized component={React.DOM.h1} className="rex-forms-Title">
        {this.props.text}
      </localized>
    );
  }
});

module.exports = Title;
