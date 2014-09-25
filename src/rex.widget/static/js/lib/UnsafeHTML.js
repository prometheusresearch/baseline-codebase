/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var UnsafeHTML = React.createClass({

  render: function() {
    return (
      <div
        className="rw-UnsafeHTML"
        dangerouslySetInnerHTML={{__html: this.props.html}}
        />
    );
  }
});

module.exports = UnsafeHTML;

