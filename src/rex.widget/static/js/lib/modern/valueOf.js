/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

function valueOf(obj) {
  if (obj && obj.valueOf) {
    return obj.valueOf();
  } else {
    return obj;
  }
}

module.exports = valueOf;
