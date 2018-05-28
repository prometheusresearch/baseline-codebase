/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var Dispatcher = require('../Dispatcher');
var constants = require('../constants');


var InstrumentVersionActions = {
  clone: function (version) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_INSTRUMENTVERSION_CLONE,
      version: version
    });
  }
};


module.exports = InstrumentVersionActions;

