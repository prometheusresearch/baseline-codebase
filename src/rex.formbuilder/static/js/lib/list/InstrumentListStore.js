/**
 * InstrumentListStore
 *
 * This store holds the state for a list of instruments.
 *
 * To use it with React component you must use `StoreListenerMixin`:
 *
 *    var InstrumentListStore = require('./InstrumentListStore')
 *    var StoreListenerMixin = require('../StoreListenerMixin')
 *
 *    var Component = React.createClass({
 *      mixins: [StoreListenerMixin(InstrumentListStore)],
 *
 *      ...
 *    });
 *
 * @jsx React.DOM
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var React   = require('react/addons');
var Emitter = require('emitter');
var merge   = require('../merge');
var API     = require('../API');
var makeURL = require('../makeURL');

var CHANGE = 'change';

var state = {
  instruments: null,
  loadingError: null,
  updatingStatus: {}
};

function notify() {
  InstrumentListStore.emit(CHANGE);
}

function setState(newState) {
  state = newState;
  notify();
}

function setStateIn(keyPath, update) {
  var directive = {};
  var current = directive;
  keyPath.forEach((key) => {
    current[key] = {};
    current = current[key];
  });
  current.$set = update;
  state = React.addons.update(state, directive);
  notify();
}

function updateInstrument(uid, update) {
  var idx;
  var instrument;
  for (var i = 0, len = state.instruments.length; i < len; i++) {
    instrument = state.instruments[i];
    if (instrument.uid === uid) {
      idx = i;
      break;
    }
  }
  instrument = merge(instrument, update);
  setStateIn(['instruments', idx], instrument);
}

function findInstrumentByUID(uid) {
  for (var i = 0, len = state.instruments.length; i < len; i++) {
    var instrument = state.instruments[i];
    if (instrument.uid === uid) {
      return instrument;
    }
  }
}

var InstrumentListStore = merge({

  getState() {
    return state;
  },

  /**
   * Load instruments
   */
  loadInstruments() {
    API.listInstruments().then(
      this._onInstrumentsLoaded.bind(this),
      this._onInstrumentsLoadedError.bind(this)
    );
  },

  _onInstrumentsLoaded(response) {
    var instruments = response.body.map((item) => ({
      uid: item.uid,
      title: item.title,
      status: item.status,
      drafts: {
        items: null,
        loadingError: null,
      },
      published: {
        items: null,
        loadingError: null,
      }
    }));
    setStateIn(['instruments'], instruments);
  },

  _onInstrumentsLoadedError(error) {
    var loadingError = 'Error loading instruments';
    setStateIn(['loadingError'], loadingError);
  },

  /**
   * Load instrument versions
   *
   * @param uid Instrument UID
   * @param groupName Name of the group to load version of
   */
  loadInstrumentVersions(uid, groupName) {
    var instrument = findInstrumentByUID(uid);
    var group = instrument[groupName];
    // check if items are already loaded
    if (group.items) {
      return;
    }
    API.listInstrumentVersions(uid, groupName).then(
      this._onInstrumentVersionsLoaded.bind(this, instrument, groupName),
      this._onInstrumentVersionsLoadedError.bind(this, instrument, groupName)
    );
  },

  _onInstrumentVersionsLoaded(instrument, groupName, response) {
    var group = merge(instrument[groupName], {
      items: response.body.map((item) => {
        var desc = null;
        if (item.published_by) {
          desc = 'Published by: ' + item.published_by;
        } else if (item.modified_by) {
          desc = 'Modified by: ' + item.modified_by;
        } else if (item.created_by) {
          desc = 'Created by: ' + item.created_by;
        }
        return {
          'uid': item.uid,
          'desc': desc
        };
      })
    });
    var update = {};
    update[groupName] = group;
    updateInstrument(instrument.uid, update);
  },

  _onInstrumentVersionsLoadedError(instrument, groupName, error) {
    var group = merge(instrument[groupName],{
      loadingError: 'Loading error'
    });
    var update = {};
    update[groupName] = group;
    updateInstrument(instrument.uid, update);
  },

  /**
   * Set instrument status
   *
   * @param uid Instrument UID
   * @param isActive Instrument status
   */
  setInstrumentStatus(uid, isActive) {
    setStateIn(['updatingStatus', uid], true);
    var instrument = findInstrumentByUID(uid);
    API.setInstrumentStatus(uid, isActive).then(
      this._onInstrumentStatusSet.bind(null, instrument),
      this._onInstrumentStatusSetError.bind(null, instrument)
    );
  },

  _onInstrumentStatusSet({uid}, response) {
    setStateIn(['updatingStatus', uid], false);
    updateInstrument(uid, {
      status: response.body.status
    });
  },

  _onInstrumentStatusSetError({uid}, error) {
    setStateIn(['updatingStatus', uid], false);
  },

  /**
   * Create new instrument version.
   *
   * @param instrument Instrument
   * @param user User which creates an instrument
   */
  createInstrumentVersion(instrument, user) {
    var definition = {
      id: `urn:${instrument.uid}`,
      version: "1.0",
      title: instrument.title,
      record: [
        {
          id: "foo",
          type: "text",
        },
      ],
    };

    API.createInstrumentVersion(instrument.uid, definition, user).then(
      this._onInstrumentVersionCreated.bind(this),
      this._onInstrumentVersionCreatedError.bind(this)
    );
  },

  _onInstrumentVersionCreated(response) {
    var {uid} = response.body;
    window.location.href = makeURL('edit', 'drafts', uid);
  },

  _onInstrumentVersionCreatedError(error) {
    console.error('error of creating a new instrument version:', error);
  },

  /**
   * Create new instrument.
   *
   * @param code Instrument code
   * @param title Instrument title
   * @param user User which creates an instrument
   */
  createInstrument(code, title, user) {
    API.createInstrument(code, title, 'disabled').then(
      this._onInstrumentCreated.bind(this, user),
      this._onInstrumentVersionCreatedError.bind(this)
    );
  },

  _onInstrumentCreated(user, response) {
    var {uid, title} = response.body;
    this.createInstrumentVersion({uid, title}, user);
  },

  _onInstrumentCreatedError(error) {
    console.error('error while creating an instrument:', error);
  },

}, Emitter.prototype);

module.exports = InstrumentListStore;
