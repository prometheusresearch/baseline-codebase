/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var Dispatcher = require('../Dispatcher');
var constants = require('../constants');


var ErrorActions = {
  report: function (error, exception) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_ERROR_REPORT,
      error: error,
      exception: exception
    });
  }
};


module.exports = ErrorActions;

