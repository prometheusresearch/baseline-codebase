/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var EventEmitter = require('component-emitter');

var Dispatcher = require('../Dispatcher');
var constants = require('../constants');


var CHANGE_EVENT = 'change';

var _settings = {};


/*eslint no-use-before-define:0 */

function initialize(settings) {
  _settings = settings;
  SettingStore.emitChange();
}


var SettingStore = Object.assign({}, EventEmitter.prototype, {
  get: function (name, defaultValue) {
    return _settings[name] === undefined ? defaultValue : _settings[name];
  },

  getAll: function () {
    return _settings;
  },

  emitChange: function () {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function (callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function (callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});


Dispatcher.register(function (action) {
  switch (action.actionType) {
    case constants.ACTION_SETTING_INITIALIZE:
      initialize(action.settings);
      break;
  }
});


module.exports = SettingStore;

