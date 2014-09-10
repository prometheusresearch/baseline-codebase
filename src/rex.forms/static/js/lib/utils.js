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

function isNumber(o) {
  return Object.prototype.toString.call(o) === '[object Number]';
}

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

function ensureInView(element) {
  var rect = element.getBoundingClientRect();
  var viewportBottom = window.innerHeight || document.documentElement.clientHeight;

  var isInView = (
    rect.top >= 0 &&
    rect.bottom <= viewportBottom
  );

  if (!isInView) {
    var alignTop = Math.abs(rect.bottom - viewportBottom) > Math.abs(rect.top);
    element.scrollIntoView(alignTop);
  }
}


module.exports = {
  mergeInto,
  merge,
  invariant,
  chain,
  isString,
  isNumber,
  isObject,
  ensureInView
};

