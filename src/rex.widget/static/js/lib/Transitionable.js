/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var transit = require('transit-js');

var _readerConfig = {
  handlers: {},
  arrayBuilder: {
    init: function(node) {
      return [];
    },
    add: function(ret, val, node) {
      ret.push(val);
      return ret;
    },
    finalize: function(ret, node) {
      return ret;
    },
    fromArray: function(arr, node) {
      return arr;
    }
  },
  mapBuilder: {
    init: function(node) {
      return {};
    },
    add: function(ret, key, val, node) {
      ret[key] = val;
      return ret;
    },
    finalize: function(ret, node) {
      return ret;
    }
  }
};

function decode(string) {
  var reader = transit.reader('json', _readerConfig);
  return reader.read(string);
}

function register(tag, handler) {
  _readerConfig.handlers[tag] = handler;
}

module.exports = {
  decode: decode,
  register: register
};
