/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var runtime = require('../runtime');

function resetForm({id}) {
  return function resetForm() {
    var state = runtime.ApplicationState.getState(`${id}/value`);
    return state.manager.reset();
  }
}

module.exports = resetForm;
