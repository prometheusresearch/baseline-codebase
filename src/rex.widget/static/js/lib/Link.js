/**
 * Link component which provides a React component API to Sitemap.
 *
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var PropTypes             = React.PropTypes;
var invariant             = require('./invariant');
var Sitemap               = require('./Sitemap');
var renderTemplatedString = require('./renderTemplatedString');

var Link = React.createClass({

  propTypes: {
    href: PropTypes.string,
    to: PropTypes.string,
    params: PropTypes.object,
    unsafe: PropTypes.bool,
    plain: PropTypes.bool
  },

  render() {
    var {children, text, unsafe, plain, params, href, to, className, ...props} = this.props;
    return (
      <a {...props} className={cx(className, "rw-Link")} href={this.href()}>
        {children ? children : text ? renderTemplatedString(text) : null}
      </a>
    );
  },

  href() {
    var {unsafe, plain, params, href, to} = this.props;
    invariant(
      href || to,
      '<Link /> component should be provide either ' +
      'with "href" or "to" prop'
    );
    invariant(
      !(href && to),
      '<Link /> component cannot be provide with ' +
      '"href" and "to" props at the same time'
    );
    invariant(
      !(to && unsafe),
      '<Link /> component cannot be provide with ' +
      '"to" and "unsafe" props at the same time'
    );
    if (to) {
      return Sitemap.linkTo(to, params, {plain});
    } else if (unsafe) {
      return Sitemap.linkUnsafe(href, params, {plain});
    } else {
      return Sitemap.link(href, params, {plain});
    }
  }
});

module.exports = Link;
