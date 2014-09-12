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
    unsafe: PropTypes.bool,
    plain: PropTypes.bool
  },

  render() {
    return this.transferPropsTo(
      <a className="rex-widget-Link" href={this.href()}>
        {this.props.children || this.props.text}
      </a>
    );
  },

  href() {
    var {unsafe, plain, params, href} = this.props;
    var link = unsafe ? ApplicationMap.linkUnsafe : ApplicationMap.link;
    return link(href, params, {plain});
  }
});

module.exports = Link;
