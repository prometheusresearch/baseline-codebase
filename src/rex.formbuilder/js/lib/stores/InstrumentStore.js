
/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var EventEmitter = require('component-emitter');

var {Ajax} = require('../util');
var Dispatcher = require('../Dispatcher');
var constants = require('../constants');
var SettingStore = require('./SettingStore');
var {ErrorActions, SuccessActions} = require('../actions');
var _ = require('../i18n').gettext;


var CHANGE_EVENT = 'change';
var CREATE_EVENT = 'create';

var _instruments = [];
var _activeInstrument = null;


/*eslint no-use-before-define:0 */

function create(instrument) {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  ajax.post(
    '/instrument',
    instrument
  ).then((data) => {
    _instruments.push(data);
    SuccessActions.report(
      _('Created Instrument %(id)s', {
        id: data.uid
      })
    );
    InstrumentStore.emitCreate(data);
    InstrumentStore.emitChange();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not create Instrument'),
      err
    );
  });
}


function activate(uid) {
  _activeInstrument = uid;
  InstrumentStore.emitChange();
}


function deactivate() {
  _activeInstrument = null;
  InstrumentStore.emitChange();
}


function retrieveAll() {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  ajax.get(
    '/instrument'
  ).then((data) => {
    _instruments = data;
    InstrumentStore.emitChange();
  }).catch((err) => {
    ErrorActions.report(
      'Could not retrieve all Instruments',
      err
    );
  });
}


if (SettingStore.get('apiBaseUrl')) {
  retrieveAll();
}
SettingStore.addChangeListener(function () {
  retrieveAll();
});


var InstrumentStore = Object.assign({}, EventEmitter.prototype, {
  get: function (uid) {
    return this.getAll().filter(i => i.uid === uid)[0];
  },

  getAll: function () {
    return _instruments;
  },

  getActive: function () {
    return this.get(_activeInstrument);
  },

  emitChange: function () {
    this.emit(CHANGE_EVENT);
  },
  addChangeListener: function (callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function (callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  emitCreate: function (instrument) {
    this.emit(CREATE_EVENT, instrument);
  },
  addCreateListener: function (callback) {
    this.on(CREATE_EVENT, callback);
  },
  removeCreateListener: function (callback) {
    this.removeListener(CREATE_EVENT, callback);
  },

  dispatchToken: Dispatcher.register(function (action) {
    switch (action.actionType) {
      case constants.ACTION_INSTRUMENT_CREATE:
        create(action.instrument);
        break;

      case constants.ACTION_INSTRUMENT_ACTIVATE:
        activate(action.uid);
        break;

      case constants.ACTION_INSTRUMENT_DEACTIVATE:
        deactivate();
        break;

      case constants.ACTION_SETTING_INITIALZE:
        retrieveAll();
        break;
    }
  })
});


module.exports = InstrumentStore;

