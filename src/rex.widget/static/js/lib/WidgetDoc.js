/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var WidgetDoc = React.createClass({
  render: function() {
    return <div dangerouslySetInnerHTML={{__html: this.props.doc}} />;
  }
});

module.exports = WidgetDoc;

