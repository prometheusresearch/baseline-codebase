/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var EventEmitter = require('component-emitter');

var Dispatcher = require('../Dispatcher');
var constants = require('../constants');


var REPORT_EVENT = 'report';

var _successes = [];


/*eslint no-use-before-define:0 */

function report(message) {
  var success = {message};
  _successes.push(success);
  SuccessStore.emitReport(success);
}


var SuccessStore = Object.assign({}, EventEmitter.prototype, {
  getLatest: function () {
    return _successes[_successes.length - 1];
  },

  getAll: function () {
    return _successes;
  },

  emitReport: function (success) {
    this.emit(REPORT_EVENT, success);
  },
  addReportListener: function (callback) {
    this.on(REPORT_EVENT, callback);
  },
  removeReportListener: function (callback) {
    this.removeListener(REPORT_EVENT, callback);
  },

  dispatchToken: Dispatcher.register(function (action) {
    switch (action.actionType) {
      case constants.ACTION_SUCCESS_REPORT:
        report(action.message);
        break;
    }
  })
});


module.exports = SuccessStore;

