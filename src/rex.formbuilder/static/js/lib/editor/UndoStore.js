/**
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var React             = require('react/addons');
var ReactForms        = require('react-forms');
var Reflux            = require('reflux');
var Immutable         = require('immutable');
var Actions           = require('./Actions');

var _UndoState = Immutable.Record({
  undo: Immutable.Stack(),
  redo: Immutable.Stack()
});

var MAX_UNDO_SiZE = 20;
var MINOR_UPDATE_INTERVAL = 1000;

var lastUpdate = -Infinity;

var UndoStore = Reflux.createStore({

  init() {
    this.state = new _UndoState();

    this.listenTo(Actions.channelUpdated, this.onChannelUpdated);
    this.listenTo(Actions.instrumentUpdated, this.onInstrumentUpdated);
    this.listenTo(Actions.undo, this.onUndo);
    this.listenTo(Actions.redo, this.onRedo);
  },

  transform(updater) {
    this.state = updater(this.state);
    this.trigger(this.state);
  },

  getInitialState() {
    return this.state;
  },

  _memoize(record, isMajor) {
    var now = new Date();
    if (!isMajor && now - lastUpdate < 1000) {
      return;
    } else {
      lastUpdate = now;
    }
    this.transform(state => {
      var undo = state.undo.unshift(record);
      if (undo.size > MAX_UNDO_SiZE) {
        undo = undo.slice(0, MAX_UNDO_SiZE);
      }
      return state
        .set('undo', undo)
        .set('redo', Immutable.Stack());
    });
  },

  onChannelUpdated(channelName, _channel, keyPath, channel) {
    var isMajor;
    // make sure all schema implements getIn protocol before uncommenting line
    // below
    try {
      isMajor = channel.node.getIn(keyPath) instanceof ReactForms.schema.CompositeNode;
    } catch (_err) {
      isMajor = true;
    }
    this._memoize({channel, channelName}, isMajor);
  },

  onInstrumentUpdated(_instrument, keyPath, instrument) {
    var isMajor;
    // make sure all schema implements getIn protocol before uncommenting line
    // below
    try {
      isMajor = instrument.node.getIn(keyPath) instanceof ReactForms.schema.CompositeNode;
    } catch (_err) {
      isMajor = true;
    }
    this._memoize({instrument}, isMajor);
  },

  onUndo(_record, current) {
    if (this.state.undo.size === 0) {
      return;
    }
    this.transform(state => {
      var undo = state.undo.shift();
      var redo = state.redo.unshift(current);
      return state.set('undo', undo).set('redo', redo);
    });
  },

  onRedo(_record, current) {
    if (this.state.redo.size === 0) {
      return;
    }
    this.transform(state => {
      var redo = state.redo.shift();
      var undo = state.undo.unshift(current);
      return state.set('undo', undo).set('redo', redo);
    });
  }
});

module.exports = UndoStore;

