/**
 * Helper mixin to add setInterval functionality to component which is bound to
 * component lifecycle and cleans up on unmount.
 *
 * @copyright 2014 Prometheus Research, LLC
 * @jsx React.DOM
 */
'use strict';

var SetIntervalMixin = {

  componentWillMount() {
    this.__setIntervalID = null;
  },

  componentWillUnmount() {
    this.clearInterval();
  },

  setInterval(code, delay) {
    this.__setIntervalID = setInterval(code, delay);
  },

  clearInterval() {
    if (this.__setIntervalID !== null) {
      clearInterval(this.__setIntervalID);
      this.__setIntervalID = null;
    }
  },

  isIntervalSet() {
    return this.__setIntervalID !== null;
  }
};

module.exports = SetIntervalMixin;
