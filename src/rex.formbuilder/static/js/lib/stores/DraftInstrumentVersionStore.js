/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var assign = require('object-assign');
var EventEmitter = require('emitter');

var {Ajax} = require('../util');
var Dispatcher = require('../Dispatcher');
var constants = require('../constants');
var SettingStore = require('./SettingStore');
var InstrumentStore = require('./InstrumentStore');
var {ErrorActions, SuccessActions} = require('../actions');
var _ = require('../i18n').gettext;


var CHANGE_EVENT = 'change';
var PUBLISH_EVENT = 'publish';
var CREATE_EVENT = 'create';

var _drafts = [];


/*eslint no-use-before-define:0 */

function retrieve(instrumentUid) {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  ajax.get(
    '/draftinstrumentversion',
    {instrument: instrumentUid}
  ).then((data) => {
    _drafts = data;
    DraftInstrumentVersionStore.emitChange();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not retrieve Drafts for Instrument %(id)s', {
        id: instrumentUid
      }),
      err
    );
  });
}


function createSkeleton() {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  ajax.post(
    '/draftset/skeleton',
    {
      instrument: InstrumentStore.getActive().uid,
      channels: SettingStore.get('channels')
    }
  ).then((data) => {
    _drafts.push(data.instrument_version);
    SuccessActions.report(
      _('Created a new, empty Draft')
    );
    DraftInstrumentVersionStore.emitCreate(data.instrument_version);
    DraftInstrumentVersionStore.emitChange();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not create a new Draft'),
      err
    );
  });
}


function cloneDraft(draft) {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  ajax.post(
    '/draftset/' + draft.uid + '/clone'
  ).then((data) => {
    _drafts.push(data.instrument_version);
    SuccessActions.report(
      _('Cloned Draft')
    );
    DraftInstrumentVersionStore.emitCreate(
      data.instrument_version,
      draft
    );
    DraftInstrumentVersionStore.emitChange();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not clone Draft'),
      err
    );
  });
}


function publishDraft(draft) {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  ajax.post(
    '/draftset/' + draft.uid + '/publish'
  ).then((data) => {
    SuccessActions.report(
      _('Published Draft as Revision %(id)s', {
        id: data.instrument_version.uid
      })
    );
    DraftInstrumentVersionStore.emitPublishing();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not publish Draft'),
      err
    );
  });
}


function deleteDraft(draft) {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  ajax.delete(
    '/draftset/' + draft.uid
  ).then(() => {
    _drafts = _drafts.filter((currentDraft) => {
      return (currentDraft.uid !== draft.uid);
    });
    SuccessActions.report(
      _('Deleted Draft')
    );
    DraftInstrumentVersionStore.emitChange();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not delete Draft'),
      err
    );
  });
}


var DraftInstrumentVersionStore = assign({}, EventEmitter.prototype, {
  get: function (uid) {
    return this.getAll().filter(i => i.uid === uid)[0];
  },

  getAll: function () {
    return _drafts;
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

  emitCreate: function (draft, originalDraft) {
    this.emit(CREATE_EVENT, draft, originalDraft);
  },
  addCreateListener: function (callback) {
    this.on(CREATE_EVENT, callback);
  },
  removeCreateListener: function (callback) {
    this.removeListener(CREATE_EVENT, callback);
  },

  emitPublishing: function () {
    this.emit(PUBLISH_EVENT);
  },
  addPublishingListener: function (callback) {
    this.on(PUBLISH_EVENT, callback);
  },
  removePublishingListener: function (callback) {
    this.removeListener(PUBLISH_EVENT, callback);
  },

  dispatchToken: Dispatcher.register(function (action) {
    switch (action.actionType) {
      case constants.ACTION_DRAFTINSTRUMENTVERSION_CREATESKELETON:
        createSkeleton();
        break;

      case constants.ACTION_DRAFTINSTRUMENTVERSION_CLONE:
        cloneDraft(action.draft);
        break;

      case constants.ACTION_DRAFTINSTRUMENTVERSION_PUBLISH:
        publishDraft(action.draft);
        break;

      case constants.ACTION_DRAFTINSTRUMENTVERSION_DELETE:
        deleteDraft(action.draft);
        break;

      case constants.ACTION_INSTRUMENT_ACTIVATE:
        Dispatcher.waitFor([
          InstrumentStore.dispatchToken
        ]);
        retrieve(action.uid);

        var refresh = function () {
          retrieve(InstrumentStore.getActive().uid);
        };
        var InstrumentVersionStore = require('./InstrumentVersionStore');
        InstrumentVersionStore.removeCloneListener(refresh);
        InstrumentVersionStore.addCloneListener(refresh);
        break;
    }
  })
});


module.exports = DraftInstrumentVersionStore;

