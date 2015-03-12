/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var Dispatcher = require('../Dispatcher');
var constants = require('../constants');


var InstrumentActions = {
  create: function (instrument) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_INSTRUMENT_CREATE,
      instrument: instrument
    });
  },

  activate: function (uid) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_INSTRUMENT_ACTIVATE,
      uid: uid
    });
  },

  deactivate: function () {
    Dispatcher.dispatch({
      actionType: constants.ACTION_INSTRUMENT_DEACTIVATE
    });
  }
};


module.exports = InstrumentActions;

