/**
 * @jsx React.DOM
 */
'use strict';

var copyProperties = require('react/lib/copyProperties');

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
