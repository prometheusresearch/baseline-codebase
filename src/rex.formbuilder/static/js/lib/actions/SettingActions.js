/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var Dispatcher = require('../Dispatcher');
var constants = require('../constants');


var SettingActions = {
  initialize: function (settings) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_SETTING_INITIALIZE,
      settings: settings
    });
  }
};


module.exports = SettingActions;

