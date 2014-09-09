/**
 * @jsx React.DOM
 */
'use strict';

var qs = require('./qs');

function makeURL(url, params, options) {
  if (typeof __MOUNT_PREFIX__ !== 'undefined') {
    url = __MOUNT_PREFIX__ + url;
  }
  if (typeof params !== 'undefined' && Object.keys(params).length > 0) {
    url = url + '?' + qs.stringify(params, options);
  }
  return url;
}

module.exports = makeURL;
