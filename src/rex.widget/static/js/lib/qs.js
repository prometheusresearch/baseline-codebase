/**
 * @jsx React.DOM
 */
'use strict';

var {flatten} = require('flat');
var qs        = require('dot-qs');

function stringify(obj) {
  obj = flatten(obj);
  for (var k in obj) {
    if (obj.hasOwnProperty(k)) {
      if (obj[k] === null || obj[k] === undefined || obj[k] === '') {
        delete obj[k];
      }
    }
  }
  return qs.stringify(obj).replace(/%2F/g, '/');
}

module.exports = {parse: qs.parse, stringify};
