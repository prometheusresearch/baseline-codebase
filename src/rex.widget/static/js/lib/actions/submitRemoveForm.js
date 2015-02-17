/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var runtime = require('../runtime');

function submitRemoveForm({id}) {
  return function submitRemoveForm() {
    var stateID = `${id}/value`;
    var state = runtime.ApplicationState.getState(stateID);
    return state.manager.submitRemove();
  }
}

module.exports = submitRemoveForm;

