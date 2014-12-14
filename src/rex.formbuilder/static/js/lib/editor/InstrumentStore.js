/**
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var React             = require('react/addons');
var ReactForms        = require('react-forms');
var Reflux            = require('reflux');
var Immutable         = require('immutable');
var Actions           = require('./Actions');
var InstrumentSchema  = require('./InstrumentSchema');

var _InstrumentState = Immutable.Record({
  instrumentName: null,
  uid: null,
  group: null,
  definition: null
});

class InstrumentState extends _InstrumentState {

  get isInitialized() {
    return this.uid && this.group && this.definition && this.instrumentName;
  }
}

var InstrumentStore = Reflux.createStore({

  init() {
    this.state = new InstrumentState({definition: this.createFormValue()});

    this.listenTo(Actions.dataLoaded, this.onDataLoaded);
    this.listenTo(Actions.instrumentUpdated, this.onInstrumentUpdated);
    this.listenTo(Actions.undo, this.onUndoRedo);
    this.listenTo(Actions.redo, this.onUndoRedo);
  },

  transform(updater) {
    this.state = updater(this.state);
    this.trigger(this.state);
  },

  getInitialState() {
    return this.state;
  },

  createFormValue(instrumentValue) {
    var root = () => this.state.definition;
    return ReactForms.Value.create(
      InstrumentSchema.create(),
      instrumentValue,
      Actions.instrumentUpdated,
      root
    );
  },

  onUndoRedo(record) {
    var {instrument} = record;
    if (instrument === undefined) {
      return;
    }
    this.transform(state => state.set('definition', instrument));
  },

  onDataCreated() {
    console.log('onDataCreated', arguments);
  },

  onDataLoaded({instrumentName, uid, group, definition}, channelValues, channelList) {
    definition = this.createFormValue(definition);
    this.transform(_ => new InstrumentState({instrumentName, uid, group, definition}));
  },

  onInstrumentUpdated(value, keyPath, prevValue) {
    this.transform(state => state.set('definition', value));
  },

  resolveType(type) {
    if (type instanceof Object)
      return type;
    // TODO: check if it's a predefined type alias
    return Map({base: type});
  },

  getRecords() {
    return this.state.definition.value.get('record');
  },

  getRecord(path, where) {
    var where = where || this.state.definition.value.get('record');
    if (!where || path.size == 0)
      return null;
    var id = path.get(0);
    var found = where.filter(record => record.get('id') === id);
    if (found.size == 0)
      return null;
    var record = found.get(0);
    if (path.size == 1)
      return record;
    var type = this.resolveType(record.get('type'));
    return this.getRecord(path.remove(0), type.get('record'));
  }

});

module.exports = InstrumentStore;
