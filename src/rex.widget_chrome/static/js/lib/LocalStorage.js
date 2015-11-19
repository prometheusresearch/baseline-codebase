/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

class LocalStorage {

  constructor(id) {
    this.id = id;
  }

  set(key, value) {
    window.localStorage[this.id + '/' + key] = JSON.stringify(value);
  }

  get(key, defaultValue) {
    var value = window.localStorage[this.id + '/' + key];
    if (typeof value == 'string') {
      return JSON.parse(value);
    } else if (defaultValue !== undefined) {
      return defaultValue;
    } else {
      return null;
    }
  }

  static getStorage(id) {
    if (!id) {
      id = window.location.host;
    }
    if (!_storage[id]) {
      _storage[id] = new this(id);
    }
    return _storage[id];
  }


};

var _storage = {};

module.exports = LocalStorage;
