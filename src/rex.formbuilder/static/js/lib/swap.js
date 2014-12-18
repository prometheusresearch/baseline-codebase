/**
 * @jsx React.DOM
 */
'use strict';

function swap(array, a, b) {
  array = array.slice(0)
  var aVal = array[a]
  var bVal = array[b]
  array[a] = bVal
  array[b] = aVal
  return array
}

module.exports = swap;
