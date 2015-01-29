/**
 * Dummy functions, usually used as defailt values (in getDefaultProps()).
 *
 * @jsx React.DOM
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

function emptyFunction() {
};

emptyFunction.thatReturnsTrue = function() {
  return true;
};

emptyFunction.thatReturnsNull = function() {
  return null;
};

module.exports = emptyFunction;
