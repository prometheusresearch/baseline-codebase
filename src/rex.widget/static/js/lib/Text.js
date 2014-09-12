/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var Text = React.createClass({

  render: function() {
    return <p className="rex-widget-Text">{this.props.text}</p>;
  }
});

module.exports = Text;
