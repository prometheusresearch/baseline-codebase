/**
 * @jsx React.DOM
 */
'use strict';

function copyProperties(obj, a, b, c, d, e, f) {
  obj = obj || {};

  if ("production" !== process.env.NODE_ENV) {
    if (f) {
      throw new Error('Too many arguments passed to copyProperties');
    }
  }

  var args = [a, b, c, d, e];
  var ii = 0, v;
  while (args[ii]) {
    v = args[ii++];
    for (var k in v) {
      obj[k] = v[k];
    }

    // IE ignores toString in object iteration.. See:
    // webreflection.blogspot.com/2007/07/quick-fix-internet-explorer-and.html
    if (v.hasOwnProperty && v.hasOwnProperty('toString') &&
        (typeof v.toString != 'undefined') && (obj.toString !== v.toString)) {
      obj.toString = v.toString;
    }
  }

  return obj;
}

function shallowCopy(x) {
  if (Array.isArray(x)) {
    return x.concat();
  } else if (x && typeof x === 'object') {
    return copyProperties(new x.constructor(), x);
  } else {
    return x;
  }
}

function set(value, path, update) {
  if (path.length === 0) {
    return update;
  }
  path = shallowCopy(path);
  var key = path.shift();
  value = shallowCopy(value);
  if (value === null) {
    value = {};
  }
  value[key] = set(value[key], path, update);
  return value;
}

class Reference {

  constructor(id, path) {
    path = path || [];

    if (!Array.isArray(path)) {
      path = path.split('.');
    }

    if (id.indexOf(':') > -1) {
      var [pid, ppath] = id.split(':', 2);
      id = pid;
      path = ppath.split('.').concat(path);
    }

    this.id = id;
    this.path = path;
  }

  set(value, update) {
    return set(value, this.path, update);
  }

  toString() {
    return `Reference(${this.id}, ${this.path})`;
  }

  static as(value) {
    if (value instanceof Reference) {
      return value;
    }
    return new Reference(value);
  }
}

module.exports = Reference;
