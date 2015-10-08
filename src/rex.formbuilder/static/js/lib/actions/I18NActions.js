/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var Dispatcher = require('../Dispatcher');
var constants = require('../constants');


var I18NActions = {
  initialize: function () {
    Dispatcher.dispatch({
      actionType: constants.ACTION_I18N_INITIALIZE
    });
  }
};


module.exports = I18NActions;

