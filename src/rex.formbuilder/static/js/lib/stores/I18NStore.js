/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var EventEmitter = require('component-emitter');
var RexI18N = require('rex-i18n');

var {ErrorActions} = require('../actions');
var Dispatcher = require('../Dispatcher');
var constants = require('../constants');
var {Ajax} = require('../util');
var _ = require('../i18n').gettext;


var CHANGE_EVENT = 'change';


var _supportedLocales = [];


/*eslint no-use-before-define:0 */

function initialize() {
  var ajax = new Ajax.Ajax({
    baseUrl: RexI18N.getInstance().config.baseUrl
  });

  ajax.get(
    '/locale/active'
  ).then((data) => {
    _supportedLocales = data.available || [];
    I18NStore.emitChange();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not retrieve Supported Locale configuration'),
      err
    );
  });
}


var I18NStore = Object.assign({}, EventEmitter.prototype, {
  get: function () {
    return RexI18N.getInstance();
  },

  getCurrentLocale: function () {
    return RexI18N.getInstance().config.locale;
  },

  getSupportedLocales: function () {
    return _supportedLocales;
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
    case constants.ACTION_I18N_INITIALIZE:
      initialize();
      break;
  }
});


module.exports = I18NStore;

