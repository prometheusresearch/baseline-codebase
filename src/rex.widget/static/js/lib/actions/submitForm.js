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
    var value = ApplicationState.get(`${id}/value`);
    if (value.isValid) {
      var update = {};
      update[`${id}/value`] = value;
      update[`${id}/submitting`] = true;
      var onSuccess = {};
      onSuccess[`${id}/submitting`] = false;
      return {
        update,
        forceRemoteUpdate: true,
        includeState: [`${id}/value_data`],
        notificationsOnComplete: [notificationOnComplete],
        onSuccess
      };
    } else {
      var update = {};
      update[`${id}/value`] = value.makeDirty();
      return {update};
    }
  });
}

module.exports = submitForm;
