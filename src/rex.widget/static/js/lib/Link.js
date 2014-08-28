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
    params: PropTypes.object,
    unsafe: PropTypes.bool
  },

  render() {
    return this.transferPropsTo(
      <a href={this.href()}>{this.props.children}</a>
    );
  },

  href() {
    var link = this.props.unsafe ? ApplicationMap.linkUnsafe : ApplicationMap.link;
    return link(this.props.href, this.props.params);
  }
});

module.exports = Link;
