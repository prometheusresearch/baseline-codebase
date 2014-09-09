/**
 * @jsx React.DOM
 */
'use strict';

var {flatten} = require('flat');
var qs        = require('dot-qs');

function stringify(obj, options) {
  options = options || {};
  obj = flatten(obj);
  if (!options.plain) {
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        if (obj[k] === null || obj[k] === undefined || obj[k] === '') {
          delete obj[k];
        }
      }
    }
  }
  var result = qs.stringify(obj).replace(/%2F/g, '/');
  if (options.plain) {
    result = result.replace(/\.[0-9]+=/g, '=');
  }
  return result;
}

module.exports = {parse: qs.parse, stringify};
