/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var Label = React.createClass({

  render: function() {
    return <span>{this.props.text}</span>;
  }
});

module.exports = Label;
