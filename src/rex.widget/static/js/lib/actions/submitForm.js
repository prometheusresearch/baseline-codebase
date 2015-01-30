/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var {ApplicationState} = require('../runtime');
var StateWriter       = require('../StateWriter');

var DEFAULT_NOTIFICATION = {
  icon: 'save',
  text: 'Data saved!'
};

function submitForm({id, notificationOnComplete}) {
  notificationOnComplete = notificationOnComplete || DEFAULT_NOTIFICATION;
  return StateWriter.createStateWriterFromFunction(function() {
    var state = ApplicationState.getState(id);
    var value = ApplicationState.get(id);
    var update = {};
    update[id] = value;
    if (value.isValid) {
      return {
        update,
        forceRemoteUpdate: true,
        includeState: [`${id}/value_data`],
        notificationsOnComplete: [notificationOnComplete]
      };
    } else {
      return {update};
    }
  });
}

module.exports = submitForm;
