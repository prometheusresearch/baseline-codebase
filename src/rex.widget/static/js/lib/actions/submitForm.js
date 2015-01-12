/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var runtime = require('../runtime');

function submitForm({id}) {
  return function submitForm() {
    var state = runtime.ApplicationState.getState(id);
    return state.manager.submit();
  }
}

module.exports = submitForm;
