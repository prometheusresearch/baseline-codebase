/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var assign = require('object-assign');
var deepCopy = require('deep-copy');
var EventEmitter = require('emitter');

var {Ajax} = require('../util');
var Dispatcher = require('../Dispatcher');
var constants = require('../constants');
var SettingStore = require('./SettingStore');
var {ErrorActions, SuccessActions} = require('../actions');
var DefinitionParser = require('../DefinitionParser');
var Configuration = require('../Configuration');
var errors = require('../errors');
var {gettext, getCurrentLocale} = require('../i18n');
var _ = gettext;


var CHANGE_EVENT = 'change';
var SAVE_EVENT = 'save';
var PUBLISH_EVENT = 'publish';
var CONFIG_FAILURE_EVENT = 'cfg-failure';

var _activeDraftSet = null;
var _activeConfiguration = null;
var _isModified = false;


/*eslint no-use-before-define:0 */

function draftToConfiguration() {
  var draftSet = _activeDraftSet;

  var forms = Object.keys(draftSet.forms).filter((key) => {
    return draftSet.forms[key].configuration !== null;
  }).map((key) => {
    return draftSet.forms[key].configuration;
  });

  var configuration;
  if ((draftSet.instrument_version.definition !== null)
      && (forms.length > 1)) {
    try {
      var parser = new DefinitionParser(
        draftSet.instrument_version.definition,
        forms
      );
      configuration = parser.getConfiguration();
    } catch (exc) {
      if (exc instanceof errors.FormBuilderError) {
        DraftSetStore.emitConfigurationFailure(exc);
      } else {
        throw exc;
      }
    }
  } else {
    configuration = new Configuration(
      'urn:' + draftSet.instrument_version.instrument.uid,
      '1.0',
      draftSet.instrument_version.instrument.title,
      getCurrentLocale()
    );
  }

  _activeConfiguration = configuration;
}


function configurationToDraft() {
  var config = _activeConfiguration;
  var draftSet = _activeDraftSet;

  var {instrument, form} = config.serialize();

  draftSet.instrument_version.definition = instrument;
  Object.keys(draftSet.forms).forEach((channel) => {
    draftSet.forms[channel].configuration = form;
  });
}


function activate(uid) {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  ajax.get(
    '/draftset/' + uid
  ).then((data) => {
    _activeDraftSet = data;
    _isModified = false;
    draftToConfiguration();
    DraftSetStore.emitChange();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not retrieve Draft %(id)s', {
        id: uid
      }),
      err
    );
  });
}


var CONFIG_ATTRIBUTES = [
  'id',
  'version',
  'title',
  'locale'
];

function editAttributes(attributes) {
  var updated = false;

  CONFIG_ATTRIBUTES.forEach((attr) => {
    if (attr in attributes) {
      _activeConfiguration[attr] = attributes[attr];
      updated = true;
    }
  });

  if (updated) {
    _isModified = true;
    configurationToDraft();
    DraftSetStore.emitChange();
  }
}


function moveElement(eid, afterEid) {
  var elements = _activeConfiguration.elements.slice(),
      elm = elements.filter(e => e.EID === eid)[0],
      afterElm = elements.filter(e => e.EID === afterEid)[0],
      elmIndex = elements.indexOf(elm),
      afterIndex = elements.indexOf(afterElm);

  elements.splice(elmIndex, 1);
  elements.splice(afterIndex, 0, elm);

  _activeConfiguration.elements = elements;
  _isModified = true;
  configurationToDraft();
  DraftSetStore.emitChange();
}


function addElement(element) {
  var elements = _activeConfiguration.elements.slice();
  element.isNew = true;
  elements.push(element);

  _activeConfiguration.elements = elements;
  _isModified = true;
  configurationToDraft();
  DraftSetStore.emitChange();
}


function cloneElement(element) {
  var elements = _activeConfiguration.elements.slice(),
      elementIndex = elements.indexOf(element),
      clone = element.clone(false, _activeConfiguration);

  elements.splice(elementIndex + 1, 0, clone);

  _activeConfiguration.elements = elements;
  _isModified = true;
  configurationToDraft();
  DraftSetStore.emitChange();
}


function updateElement(element) {
  var elements = _activeConfiguration.elements.slice(),
      elm = elements.filter(e => e.EID === element.EID)[0],
      elmIndex = elements.indexOf(elm);

  delete element.isNew;
  elements[elmIndex] = element;

  _activeConfiguration.elements = elements;
  _isModified = true;
  configurationToDraft();
  DraftSetStore.emitChange();
}


function deleteElement(element) {
  var elements = _activeConfiguration.elements.slice(),
      elementIndex = elements.indexOf(element);

  elements.splice(elementIndex, 1);

  _activeConfiguration.elements = elements;
  _isModified = true;
  configurationToDraft();
  DraftSetStore.emitChange();
}


function publishActive() {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  ajax.post(
    '/draftset/' + _activeDraftSet.instrument_version.uid + '/publish'
  ).then(() => {
    SuccessActions.report(
      _('Draft %(id)s has been Published', {
        id: _activeDraftSet.instrument_version.uid
      })
    );
    DraftSetStore.emitPublish();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not publish Draft %(id)s', {
        id: _activeDraftSet.instrument_version.uid
      }),
      err
    );
  });
}


function saveActive() {
  var ajax = new Ajax.Ajax({
    baseUrl: SettingStore.get('apiBaseUrl')
  });

  var draftSet = deepCopy(_activeDraftSet);
  delete draftSet.instrument_version.modified_by;
  delete draftSet.instrument_version.date_modified;

  ajax.put(
    '/draftset/' + draftSet.instrument_version.uid,
    draftSet
  ).then(() => {
    _isModified = false;
    SuccessActions.report(
      _('Draft %(id)s has been Saved', {
        id: _activeDraftSet.instrument_version.uid
      })
    );
    DraftSetStore.emitChange();
    DraftSetStore.emitSave();
  }).catch((err) => {
    ErrorActions.report(
      _('Could not save Draft %(id)s', {
        id: _activeDraftSet.instrument_version.uid
      }),
      err
    );
  });
}


var DraftSetStore = assign({}, EventEmitter.prototype, {
  getActive: function () {
    return _activeDraftSet;
  },

  getActiveConfiguration: function () {
    return _activeConfiguration;
  },

  getActiveElements: function () {
    return _activeConfiguration ? _activeConfiguration.elements : [];
  },

  activeIsModified: function () {
    return _isModified;
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

  emitSave: function () {
    this.emit(SAVE_EVENT);
  },
  addSaveListener: function (callback) {
    this.on(SAVE_EVENT, callback);
  },
  removeSaveListener: function (callback) {
    this.removeListener(SAVE_EVENT, callback);
  },

  emitPublish: function () {
    this.emit(PUBLISH_EVENT);
  },
  addPublishListener: function (callback) {
    this.on(PUBLISH_EVENT, callback);
  },
  removePublishListener: function (callback) {
    this.removeListener(PUBLISH_EVENT, callback);
  },

  emitConfigurationFailure: function (error) {
    this.emit(CONFIG_FAILURE_EVENT, error);
  },
  addConfigurationFailureListener: function (callback) {
    this.on(CONFIG_FAILURE_EVENT, callback);
  },
  removeConfigurationFailureListener: function (callback) {
    this.removeListener(CONFIG_FAILURE_EVENT, callback);
  },

  dispatchToken: Dispatcher.register(function (action) {
    switch (action.actionType) {
      case constants.ACTION_DRAFTSET_ACTIVATE:
        activate(action.uid);
        break;

      case constants.ACTION_DRAFTSET_EDITATTRIBUTES:
        editAttributes(action.attributes);
        break;

      case constants.ACTION_DRAFTSET_ADDELEMENT:
        addElement(action.element);
        break;

      case constants.ACTION_DRAFTSET_CLONEELEMENT:
        cloneElement(action.element);
        break;

      case constants.ACTION_DRAFTSET_UPDATEELEMENT:
        updateElement(action.element);
        break;

      case constants.ACTION_DRAFTSET_DELETEELEMENT:
        deleteElement(action.element);
        break;

      case constants.ACTION_DRAFTSET_MOVEELEMENT:
        moveElement(action.eid, action.afterEid);
        break;

      case constants.ACTION_DRAFTSET_PUBLISH:
        publishActive();
        break;

      case constants.ACTION_DRAFTSET_SAVE:
        saveActive();
        break;
    }
  })
});


module.exports = DraftSetStore;

