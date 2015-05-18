/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var TimeoutMixin = {

  componentWillMount() {
    this._timeouts = [];
  },

  componentWillUnmount() {
    this._timeouts.forEach(this.clearTimeout);
    this._timeouts = null;
  },

  setTimeout(func, ms) {
    var timeoutID = setTimeout(() => {
      this.clearTimeout(timeoutID);
      func();
    }, ms);
    this._timeouts.push(timeoutID);
    return timeoutID;
  },

  clearTimeout(timeoutID) {
    clearTimeout(timeoutID);
    var idx = this._timeouts.indexOf(timeoutID);
    if (idx > -1) {
      this._timeouts.splice(idx, 1);
    }
  }

};

module.exports = TimeoutMixin;
