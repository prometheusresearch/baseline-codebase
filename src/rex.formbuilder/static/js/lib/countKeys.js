/**
 * @jsx React.DOM
 */
'use strict';

function countKeys(o) {
  var ret = 0;
  for (var k in o) {
    if (o.hasOwnProperty(k)) {
      ret++;
    }
  }
  return ret;
}

module.exports = countKeys;
