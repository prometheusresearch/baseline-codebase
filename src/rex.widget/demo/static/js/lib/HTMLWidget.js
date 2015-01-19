/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var HTMLWidget = React.createClass({
  render: function() {
    return <div dangerouslySetInnerHTML={{__html: this.props.html}} />;
  }
});

module.exports = HTMLWidget;

