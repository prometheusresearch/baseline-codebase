/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react');
var PropTypes       = React.PropTypes;
var ApplicationMap  = require('./ApplicationMap');

var Link = React.createClass({

  propTypes: {
    href: PropTypes.string.isRequired,
    params: PropTypes.object
  },

  render: function() {
    var href = ApplicationMap.link(this.props.href, this.props.params);
    return this.transferPropsTo(
      <a href={href}>{this.props.children}</a>
    );
  }
});

module.exports = Link;
