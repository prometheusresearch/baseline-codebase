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
  var viewportBottom = window.innerHeight ||
    document.documentElement.clientHeight;

  var isInView = (
    rect.top >= 0 &&
    rect.bottom <= viewportBottom
  );

  if (!isInView) {
    var alignTop = Math.abs(rect.bottom - viewportBottom) > Math.abs(rect.top);
    element.scrollIntoView(alignTop);
  }
}

/**
 * And element by key in an array `elements`.
 *
 * @param {Array<V>} elements
 * @param {Function<V, K>} keyFunc
 * @param {V} key
 *
 * @returns V|Null
 */
function findAfter(elements, keyFunc, key) {
  var found;
  for (var i = 0, len = elements.length; i < len; i++) {
    var current = elements[i];
    var next = elements[i + 1];
    if (keyFunc(current, i) === key && next !== undefined) {
      found = keyFunc(next, i + 1);
      break;
    }
  }
  return found || null;
}

function emptyFunction() {
}

emptyFunction.thatReturnsArgument = function (arg) {
  return arg;
};

module.exports = {
  mergeInto,
  merge,
  invariant,
  chain,
  isString,
  isNumber,
  isObject,
  ensureInView,
  findAfter,
  emptyFunction
};

