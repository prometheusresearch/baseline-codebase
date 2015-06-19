/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var TimeoutMixin = require('./TimeoutMixin');

var SingleTimeoutMixin = {
  ...TimeoutMixin,

  setTimeout(func, ms) {
    this.clearTimeout();
    return TimeoutMixin.setTimeout.call(this, func, ms);
  }
};

module.exports = SingleTimeoutMixin;
