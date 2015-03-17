/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react');
var qs    = require('../qs');

var Link = React.createClass({

  propTypes: {
    href: React.PropTypes.string.isRequired,
    params: React.PropTypes.object
  },

  render() {
    var {href, children, params, ...props} = this.props;
    if (params) {
      href = href + '?' + qs.stringify(params);
    }
    return (
      <a {...props} href={href}>{children}</a>
    );
  }

});

module.exports = Link;
