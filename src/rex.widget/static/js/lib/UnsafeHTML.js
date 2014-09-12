/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var UnsafeHTML = React.createClass({

  render: function() {
    return (
      <div
        className="rex-widget-UnsafeHTML"
        dangerouslySetInnerHTML={{__html: this.props.html}}
        />
    );
  }
});

module.exports = UnsafeHTML;

