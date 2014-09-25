/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var Header = React.createClass({

  render: function() {
    var h = React.DOM['h' + this.props.level];
    return <h className="rw-Header">{this.props.text}</h>;
  },

  getDefaultProps() {
    return {level: 1};
  }
});

module.exports = Header;
