/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var runtime           = require('../runtime');
var StateWriter       = require('../StateWriter');

var DEFAULT_WORKFLOW = 'DEFAULT_WORKFLOW';

function transition({id, to}) {
  id = id || DEFAULT_WORKFLOW;
  return StateWriter.createStateWriterFromFunction(function() {
    var state = runtime.ApplicationState.getState(`${id}/active`);
    var update = {};
    update[id] = to;
    return {update};
  });
}

module.exports = transition;

