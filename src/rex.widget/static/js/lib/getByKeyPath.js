/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var isArray = require('./isArray');

/**
 * Get value by ``keyPath`` within the ``obj``.
 */
function getByKeyPath(obj, keyPath) {
  if (!isArray(keyPath)) {
    keyPath = keyPath.split('.').filter(Boolean);
  }
  for (var i = 0, len = keyPath.length; i < len; i++) {
    if (obj == null) {
      return obj;
    }
    obj = obj[keyPath[i]];
  }
  return obj;
}

module.exports = getByKeyPath;
