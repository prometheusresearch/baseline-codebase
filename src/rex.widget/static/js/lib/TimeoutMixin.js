/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {batchedUpdates} from 'react/addons';

export default {

  componentWillMount() {
    this._timeouts = [];
  },

  componentWillUnmount() {
    this.clearTimeout();
  },

  setTimeout(func, ms) {
    let  timeoutID = setTimeout(() => {
      this.clearTimeout(timeoutID);
      batchedUpdates(func);
    }, ms);
    this._timeouts.push(timeoutID);
    return timeoutID;
  },

  clearTimeout(timeoutID) {
    if (timeoutID === undefined) {
      this._timeouts.forEach(function(timeoutID) {
        clearTimeout(timeoutID);
      });
      this._timeouts = [];
    } else {
      clearTimeout(timeoutID);
      let idx = this._timeouts.indexOf(timeoutID);
      if (idx > -1) {
        this._timeouts.splice(idx, 1);
      }
    }
  }

};
