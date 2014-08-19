/**
 * @jsx React.DOM
 */
'use strict';

function mergeInto(dst, src) {
  for (var k in src) {
    if (src.hasOwnProperty(k)) {
      dst[k] = src[k];
    }
  }
}

function merge(a, b) {
  var r = {};
  mergeInto(r, a);
  mergeInto(r, b);
  return r;
}

function chain(a, b) {
  return function() {
    if (a) {
      a.apply(null, arguments);
    }
    if (b) {
      b.apply(null, arguments);
    }
  };
}

function invariant(condition, message) {
  if (!condition) {
    throw new Error('Invariant violation: ' + message);
  }
}

function isString(o) {
  return Object.prototype.toString.call(o) === '[object String]';
}

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}


module.exports = {mergeInto, merge, invariant, chain, isString, isObject};
