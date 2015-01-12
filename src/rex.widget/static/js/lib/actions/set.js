/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var runtime = require('../runtime');

function set({id, value}) {
  return function set() {
    var state = runtime.ApplicationState.getState(id);
    return state.manager.set(value);
  }
}

module.exports = set;
