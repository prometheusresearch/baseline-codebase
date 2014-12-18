/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var MenuItem = React.createClass({

  getDefaultProps: function () {
    return {
      href: '#'
    };
  },

  renderLink: function () {
    return this.transferPropsTo(
      <a>{this.props.children}</a>
    );
  },

  render: function() {
    return (
      <li>{this.renderLink()}</li>
    );
  }
});

module.exports = MenuItem;
