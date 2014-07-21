/**
 * @jsx React.DOM
 */
'use strict';

function chainFunction(a, b) {
  return function() {
    a.apply(null, arguments);
    if (b) {
      b.apply(null, arguments);
    }
  }
}

module.exports = chainFunction;
