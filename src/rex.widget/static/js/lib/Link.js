/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var Link = React.createClass({

  render: function() {
    return <a href={this.props.url}>{this.props.text}</a>;
  }
});

module.exports = Link;
