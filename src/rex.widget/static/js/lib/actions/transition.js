/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var runtime = require('../runtime');

function transition({id, to}) {
  return function transition() {
    id = id || 'DEFAULT_WORKFLOW';
    var state = runtime.ApplicationState.getState(`${id}/active`);
    state.manager.set(to);
    runtime.ApplicationState.history.pushState();
  }
}

module.exports = transition;

