/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var Section = React.createClass({

  render: function() {
    return <div>{this.props.content}</div>;
  }
});

module.exports = Section;
