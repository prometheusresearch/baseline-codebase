/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var Dispatcher = require('../Dispatcher');
var constants = require('../constants');


var SuccessActions = {
  report: function (message) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_SUCCESS_REPORT,
      message: message
    });
  }
};


module.exports = SuccessActions;

