/**
 * Editor actions.
 *
 * This module provides all the possible actions for Formbuilder Editor
 * application.
 *
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var Reflux  = require('reflux');
var API     = require('../API');

var Actions = {

  /**
   * Update instrument.
   */
  instrumentUpdated: Reflux.createAction(),

  /**
   * Make channel active.
   */
  channelActivated: Reflux.createAction(),

  /**
   * Update instrument.
   */
  channelUpdated: Reflux.createAction(),

  /**
   * Channel enabled.
   */
  channelEnabled: Reflux.createAction(),

  /**
   * Channel disabled.
   */
  channelDisabled: Reflux.createAction(),

  /**
   * Publish instrument and forms.
   */
  publish: Reflux.createAction({
    preEmit(home, uid) {
      API.publishInstrumentAndForms(uid).then(
        this.onPublished.bind(this, home),
        Actions.publishError
      );
    },

    onPublished(home, response) {
      var uid = response.body.instrument_version.uid;
      Actions.redirectTo(home, uid, 'published');
    }
  }),

  publishError: Reflux.createAction(),

  /**
   * Load data for given uid and group
   */
  dataLoad: Reflux.createAction({

    preEmit(uid, group) {
      API.listChannels().then(
        this.onChannelsLoaded.bind(this, uid, group),
        this.onLoadingError
      );
    },

    onChannelsLoaded(uid, group, response) {
      var channels = response.body;
      API.getInstrumentAndForms(uid, group).then(
        this.onInstrumentAndFormsLoaded.bind(this, uid, group, channels),
        this.onLoadingError
      );
    },

    onInstrumentAndFormsLoaded(uid, group, channelList, response) {
      var body = response.body;
      var instrumentVersion = body.instrument_version;
      var instrumentName = instrumentVersion.instrument.code;
      var definition = instrumentVersion.definition;
      var channelValues = {};
      var forms = body.forms;
      for (var name in forms) {
        if (forms.hasOwnProperty(name)) {
          channelValues[name] = forms[name].configuration;
        }
      }
      Actions.dataLoaded({uid, group, definition, instrumentName},
                          channelValues, channelList);
    },

    onLoadingError() {
      Actions.dataLoadedError();
    }

  }),

  /**
   * Data loaded.
   */
  dataLoaded: Reflux.createAction(),

  /**
   * Data loading error.
   */
  dataLoadedError: Reflux.createAction(),

  dataSave: Reflux.createAction({
    preEmit(uid, instrument, channels) {
      API.saveInstrumentAndForms(uid, instrument, channels)
        .then(
          Actions.dataSaved,
          Actions.dataSavedError
        );
    }
  }),

  createDraft: Reflux.createAction({
    preEmit(home, instrumentName, uid, instrument, channels) {
      API.createDraftset(instrumentName, uid, instrument, channels)
        .then(
          this.onDraftCreated.bind(this, home),
          Actions.draftCreationError
        );
    },

    onDraftCreated(home, response) {
      var uid = response.body.instrument_version.uid;
      Actions.redirectTo(home, uid, 'drafts');
    }
  }),

  redirectTo: Reflux.createAction({
    preEmit(home, uid, group) {
      window.location.href = `${home}/edit/${group}/${uid}`;
    }
  }),

  draftCreationError: Reflux.createAction(),

  dataSaved: Reflux.createAction(),

  dataSavedError: Reflux.createAction(),

  transactionStarted: Reflux.createAction(),

  transactionRolledBack: Reflux.createAction(),

  transactionCommitted: Reflux.createAction(),

  setLocalizations: Reflux.createAction(),

  undo: Reflux.createAction({
    preEmit() {
      var UndoStore = require('./UndoStore');
      var InstrumentStore = require('./InstrumentStore');
      var ChannelStore = require('./ChannelStore');

      var channelName = ChannelStore.state.active;
      var undo = UndoStore.state.undo.first();
      var current = {
        instrument: InstrumentStore.state.definition,
        channelName: channelName,
        channel: ChannelStore.state.channels.get(channelName).get('configuration')
      };

      return [undo, current];
    }
  }),

  redo: Reflux.createAction({

    preEmit() {
      var UndoStore = require('./UndoStore');
      var InstrumentStore = require('./InstrumentStore');
      var ChannelStore = require('./ChannelStore');
      
      var channelName = ChannelStore.state.active;
      var redo = UndoStore.state.redo.first();
      var current = {
        instrument: InstrumentStore.state.definition,
        channelName: channelName,
        channel: ChannelStore.state.channels.get(channelName).get('configuration')
      };

      return [redo, current];
    }
  })

};

module.exports = Actions;
