/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var runtime = require('../runtime');

function submitRemoveForm({id}) {
  return function submitRemoveForm() {
    var state = runtime.ApplicationState.getState(id);
    return state.manager.submitRemove();
  }
}

module.exports = submitRemoveForm;

