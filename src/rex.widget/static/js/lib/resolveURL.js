
/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var invariant = require('./invariant');

var IS_ABSOLUTE_URL = /^https?:\/\//;
var PACKAGE_ROUTE_RE = /^([a-zA-Z0-9_\.\-]+):(.+)$/;

/**
 * Resolve URL.
 */
function resolveURL(url) {
  if (IS_ABSOLUTE_URL.exec(url)) {
    return url;
  }
  if (typeof __MOUNT_POINTS__ !== 'undefined') {
    return url.replace(PACKAGE_ROUTE_RE, function(_, pkg, path) {
      pkg = __MOUNT_POINTS__[pkg];
      invariant(pkg !== undefined);
      return pkg + path;
    });
  }
  invariant(!PACKAGE_ROUTE_RE);
  return url;
}

module.exports = resolveURL;
