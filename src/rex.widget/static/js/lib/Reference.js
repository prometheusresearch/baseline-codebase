/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');

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
    var directive = {};
    var current = directive;
    for (var i = 0, len = this.path.length; i < len; i++) {
      var key = this.path[i];
      current[key] = {};
      current = current[key];
    }
    current.$set = update;
    return React.addons.update(value, directive);
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
