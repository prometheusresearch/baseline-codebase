/**
 * Copyright (c) 2014, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';


var log;

if ((process.env.NODE_ENV !== 'production') && (console) && (console.log)) {
  log = function () {
    if (typeof console.log === 'function') {
      console.log.apply(console, arguments);
    } else {
      console.log(Array.prototype.slice.call(arguments));
    }
  };
} else {
  log = function () {};
}


module.exports = log;

