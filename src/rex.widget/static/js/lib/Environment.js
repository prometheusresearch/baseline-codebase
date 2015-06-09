/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Environment = {
  isTouchDevice: (
    'ontouchstart' in document.documentElement ||
    'onmsgesturechange' in window
  )
};

module.exports = Environment;
