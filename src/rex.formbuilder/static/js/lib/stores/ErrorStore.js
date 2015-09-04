
/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var EventEmitter = require('component-emitter');

var Dispatcher = require('../Dispatcher');
var constants = require('../constants');


var REPORT_EVENT = 'report';

var _errors = [];


/*eslint no-use-before-define:0 */

function report(error, exception, additional) {
  var err = {error, exception, additional};
  _errors.push(err);
  console.error(error, additional, exception);
  ErrorStore.emitReport(err);
}


var ErrorStore = Object.assign({}, EventEmitter.prototype, {
  getLatest: function () {
    return _errors[_errors.length - 1];
  },

  getAll: function () {
    return _errors;
  },

  emitReport: function (error) {
    this.emit(REPORT_EVENT, error);
  },
  addReportListener: function (callback) {
    this.on(REPORT_EVENT, callback);
  },
  removeReportListener: function (callback) {
    this.removeListener(REPORT_EVENT, callback);
  },

  dispatchToken: Dispatcher.register(function (action) {
    switch (action.actionType) {
      case constants.ACTION_ERROR_REPORT:
        report(action.error, action.exception, action.additional);
        break;
    }
  })
});


module.exports = ErrorStore;

