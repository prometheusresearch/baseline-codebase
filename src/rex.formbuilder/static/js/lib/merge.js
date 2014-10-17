/**
 * @jsx React.DOM
 */
'use strict';

var mergeInto = require('./mergeInto');

function merge(a, b) {
  if (!b) {
    return a;
  }
  var r = {};
  mergeInto(r, a);
  mergeInto(r, b);
  return r;
}

module.exports = merge;
