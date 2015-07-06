/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var assign = require('object-assign');
var EventEmitter = require('component-emitter');

var {Ajax} = require('../util');
var Dispatcher = require('../Dispatcher');
var constants = require('../constants');
var SettingStore = require('./SettingStore');
var InstrumentStore = require('./InstrumentStore');
var {ErrorActions, SuccessActions} = require('../actions');
var _ = require('../i18n').gettext;


var CHANGE_EVENT = 'change';
var CLONE_EVENT = 'clone';

var _versions = [];


/*eslint no-use-before-define:0 */

function retrieve(instrumentUid) {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  ajax.get(
    '/instrumentversion',
    {instrument: instrumentUid}
  ).then((data) => {
    _versions = data;
    InstrumentVersionStore.emitChange();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not retrieve Revisions for Instrument %(id)s', {
        id: instrumentUid
      }),
      err
    );
  });
}


function clone(version) {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  ajax.post(
    '/instrumentversion/' + version.uid + '/draft',
    {}
  ).then(() => {
    SuccessActions.report(
      _('Cloned Revision %(id)s', {
        id: version.uid
      })
    );
    InstrumentVersionStore.emitClone();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not clone Revision %(id)s', {
        id: version.uid
      }),
      err
    );
  });
}


var InstrumentVersionStore = assign({}, EventEmitter.prototype, {
  get: function (uid) {
    return this.getAll().filter(i => i.uid === uid)[0];
  },

  getAll: function () {
    return _versions;
  },

  getLatestVersion: function () {
    return this.getAll().slice().sort((a, b) => {
      return b.version - a.version;
    })[0];
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

  emitClone: function () {
    this.emit(CLONE_EVENT);
  },
  addCloneListener: function (callback) {
    this.on(CLONE_EVENT, callback);
  },
  removeCloneListener: function (callback) {
    this.removeListener(CLONE_EVENT, callback);
  },

  dispatchToken: Dispatcher.register(function (action) {
    switch (action.actionType) {
      case constants.ACTION_INSTRUMENTVERSION_CLONE:
        clone(action.version);
        break;

      case constants.ACTION_INSTRUMENT_ACTIVATE:
        Dispatcher.waitFor([
          InstrumentStore.dispatchToken
        ]);
        retrieve(action.uid);

        var refresh = function () {
          retrieve(InstrumentStore.getActive().uid);
        };
        var DraftInstrumentVersionStore = require(
          './DraftInstrumentVersionStore'
        );
        DraftInstrumentVersionStore.removePublishingListener(refresh);
        DraftInstrumentVersionStore.addPublishingListener(refresh);
        break;
    }
  })
});


module.exports = InstrumentVersionStore;

