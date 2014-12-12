/**
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var React            = require('react/addons');
var ReactForms       = require('react-forms');
var Reflux           = require('reflux');
var Immutable        = require('immutable');
var ChannelSchema    = require('./ChannelSchema');
var InstrumentSchema = require('./InstrumentSchema');
var Actions          = require('./Actions');
var InstrumentStore  = require('./InstrumentStore');
var {ListNode, ScalarNode,
     MappingNode}    = ReactForms.schema;
var InstrumentRecordNode = InstrumentSchema.InstrumentRecordNode;
var SIMPLE_TYPES     = InstrumentSchema.SIMPLE_TYPES;
var COMPLEX_TYPES    = InstrumentSchema.COMPLEX_TYPES;

var DEFAULT_LOCALIZATIONS = Immutable.OrderedMap({
  'en': 'English',
  'fr': 'French',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'es': 'Spanish'
});

var _ChannelsState = Immutable.Record({
  localizations: DEFAULT_LOCALIZATIONS,
  active: null,
  channels: Immutable.Map()
}, 'ChannelsState');

class ChannelsState extends _ChannelsState {

  get isInitialized() {
    return this.active !== null;
  }
}

var ChannelState = Immutable.Record({
  title: null,
  configuration: null
}, 'ChannelState');

var ChannelStore = Reflux.createStore({

  init() {
    this.state = new ChannelsState();

    this.listenTo(Actions.instrumentUpdated, this.onInstrumentUpdated);
    this.listenTo(Actions.channelActivated, this.onChannelActivated);
    this.listenTo(Actions.channelUpdated, this.onChannelUpdated);
    this.listenTo(Actions.channelEnabled, this.onChannelEnabled);
    this.listenTo(Actions.channelDisabled, this.onChannelDisabled);
    this.listenTo(Actions.dataLoaded, this.onDataLoaded);
    this.listenTo(Actions.setLocalizations, this.onSetLocalizations)
    this.listenTo(Actions.undo, this.onUndoRedo);
    this.listenTo(Actions.redo, this.onUndoRedo);
  },

  getInitialState() {
    return this.state;
  },

  getActiveChannelName() {
    return this.state.active;
  },

  transform(updater) {
    this.state = updater(this.state);
    this.trigger(this.state);
  },

  createFormValue(channelName, channelValue) {
    var onUpdate = Actions.channelUpdated.bind(null, channelName);
    var root = () => this.state.getIn(['channels', channelName, 'configuration']);
    var localizations = this.state.get('localizations');
    var schema = ChannelSchema.create({localizations});
    return ReactForms.Value.create(schema, channelValue, onUpdate, root);
  },

  onUndoRedo({channel, channelName}) {
    if (channel === undefined) {
      return;
    }
    this.transform(state => {
      return state.setIn(['channels', channelName, 'configuration'], channel);
    });
  },

  removeQuestion(id) {
    console.log('removing question', id);
    var self = this;
    this.state.channels.forEach((channel, channelName) => {
      var configuration = channel.get('configuration');
      if (!configuration)
        return;
      var found = this.findQuestions(configuration.value, id);
      if (found.length) {
        for (var i in found) {
          value = value.removeIn(found[i].path);
        }
        configuration.transform(_ => value).notify();
      }
    });
  },

  getUniquePageId(channelName) {
    // TODO
    var total = this.state.channels
      .get(channelName)
      .get('configuration').value
      .get('pages').size;
    return `page_${total}`;
  },

  questionEnumerations(type) {
    var enumerations = [];
    type.get('enumerations').forEach((description, id) => {
      enumerations.push({
        id: id
      });
    });
    return enumerations;
  },

  questionColumns(type) {
    var columns = [];
    type.get('columns')
      .forEach(column => {
        columns.push(this.questionOptionsFromRecord(column));
      });
    return columns;
  },

  questionQuestions(type) {
    var questions = [];
     type.get('record')
      .forEach(record => {
        questions.push(this.questionOptionsFromRecord(record))
      });
    return questions;
  },

  questionRows(type) {
    var rows = [];
    type.get('rows')
      .forEach(record => {
        rows.push({ id: row.id })
      });
    return rows;
  },

  questionOptionsFromRecord(data) {
    var options = {
      fieldId: data.get('id')
    };
    var type = InstrumentStore.resolveType(data.get('type'));
    var base = type.get('base');
    switch (base) {
      case SIMPLE_TYPES.ENUMERATION:
      case SIMPLE_TYPES.ENUMERATION_SET:
        options.enumerations = this.questionEnumerations(type);
        break;
      case COMPLEX_TYPES.RECORD_LIST:
        options.questions = this.questionQuestions(type);
        break;
      case COMPLEX_TYPES.MATRIX:
        options.questions = this.questionColumns(type);
        options.rows = this.questionRows(type);
        break;
    }
    return options;
  },

  questionFromRecord(data) {
    var question = {
      type: 'question',
      options: this.questionOptionsFromRecord(data)
    };
    return question;
  },

  addQuestion(id, data) {
    var self = this;
    this.state.channels.forEach((channel, channelName) => {
      var configuration = channel.get('configuration');
      if (!configuration)
        return;
      var totalPages = configuration.value.get('pages').size;
      var page = Immutable.fromJS({
        id: self.getUniquePageId(channelName),
        elements: [self.questionFromRecord(data)]
      });
      configuration.transform(value => value.setIn(['pages', totalPages], page));
    });
  },

  onSetLocalizations(localizations) {
    this.transform(state =>
      state.set('localizations', localizations));
  },

  onDataLoaded(_instrument, channelValues, channelList) {
    var channels = {};
    var active = null;

    channelList.forEach(channel => {
      var {uid, title} = channel;
      var configuration = channelValues[uid] ?
        this.createFormValue(uid, channelValues[uid]) :
        null;
      channels[uid] = new ChannelState({title, configuration});
    });

    if (!active && channelList.length) {
      active = channelList[0].uid;
    }

    this.transform(state => new ChannelsState({
      active: active,
      channels: Immutable.fromJS(channels)
    }));
  },

  onChannelActivated(channelName) {
    this.transform(state =>
      state.set('active', channelName));
  },

  onChannelUpdated(channelName, value) {
    this.transform(state =>
      state.setIn(['channels', channelName, 'configuration'], value));
  },

  onChannelEnabled(channelName) {
    var value = this.createFormValue(channelName, undefined);
    this.transform(state =>
      state.setIn(['channels', channelName, 'configuration'], value));
  },

  onChannelDisabled(channelName) {
    this.transform(state =>
      state.setIn(['channels', channelName, 'configuration'], null));
  },

  _recordIndex(prevList, nextList) {
    var index = {};
    prevList.forEach(record => {
      var id = record.get('id');
      if (id) {
        index[id] = { prev: record, next: null };
      }
    });
    nextList.forEach(record => {
      var id = record.get('id');
      if (id) {
        var item = index[id] = index[id] || { prev: null };
        item.next = record;
      }
    });
    return index;
  },

  onRecordListUpdated(updated, initial) {
    var index = this._recordIndex(initial.value, updated.value);
    for(var id in index) {
      if (index.hasOwnProperty(id)) {
        var item = index[id];
        if (!item.next) {
          this.removeQuestion(id);
        }
        else if (!item.prev) {
          this.addQuestion(id, item.next);
        }
      }
    }
  },

  findQuestions(configuration, id) {
    var found = [];
    configuration.get('pages').forEach((page, pageN) => {
      page.get('elements').forEach((element, elementN) => {
        if (element.get('type') === 'question' &&
            element.get('options').get('fieldId') === id) {
          found.push({
            path: ['pages', pageN, 'elements', elementN],
            value: element
          });
        }
      });
    });
    return found;
  },

  syncDescLists(current, blank) {
    var allowed = {};
    blank.forEach(desc => {
      allowed[desc.id] = true;
      if (current.filter(x => x.id === desc.id).size == 0)
        current = current.push(desc);
    });
    current = current.filter(x => allowed[x.id]);
    return current;
  },

  syncQuestionLists(current, blank) {
    var allowed = {};
    blank.forEach(question => {
      allowed[question.fieldId] = true;
      if (current.filter(x => x.fieldId === question.fieldId).size == 0)
        current = current.push(question);
    });
    current = current.filter(x => allowed[x.id]);
    return current;
  },

  applyChangesToQuestion(type, current, blank) {
    var base = type.get('base');
    var value = current;
    var options = current.get('options');
    var blankOptions = blank.get('options');
    switch (base) {
      case SIMPLE_TYPES.ENUMERATION:
      case SIMPLE_TYPES.ENUMERATION_SET:
        console.log('value1', value.toJS(), 'blank', blank.toJS());
        value = value.setIn(['options','enumerations'],
          this.syncDescLists(options.get('enumerations') || Immutable.List.of(),
            blankOptions.get('enumerations')));
        break;
      case COMPLEX_TYPES.RECORD_LIST:
        value = value.setIn(['options','questions'],
          this.syncQuestionLists(options.get('questions') || Immutable.List.of(),
            blankOptions.get('questions')));
        break;
      case COMPLEX_TYPES.MATRIX:
        value = value.setIn(['options','columns'],
          this.syncQuestionLists(options.get('columns') || Immutable.List.of(),
            blankOptions.get('columns')));
        value = value.setIn(['options', 'rows'],
          this.syncDescLists(options.get('rows') || Immutable.List.of(),
            blankOptions.get('rows')));
        break;
    }
    return value;
  },

  onRecordUpdated(keyPath, updated, initial) {
    console.log('initial.value', initial.value.toJS());
    var prevId = initial.value.get('id');
    var nextId = initial.value.get('id');

    var prevType = InstrumentStore.resolveType(initial.value.get('type'));
    var nextType = InstrumentStore.resolveType(updated.value.get('type'));

    var renamed = prevId !== nextId;
    var typeChanged = !Immutable.is(prevType, nextType);

    if (renamed || typeChanged) {
      this.state.channels.forEach((channel, channelName) => {
        var configuration = channel.get('configuration');
        if (!configuration)
          return;
        var found = this.findQuestions(configuration.value, prevId);
        if (found.length == 0) {
          this.addQuestion(nextId, updated.value);
          return;
        }
        if (found.length > 1) {
          console.error(`Question #{$prevId} defined more than once`);
        }
        found = found[0];
        if (renamed)
          found.value = found.value.setIn(['options', 'fieldId'], updated.get('id'));
        if (typeChanged) {
          var blank = Immutable.fromJS(this.questionFromRecord(updated.value));
          found.value = this.applyChangesToQuestion(nextType, found.value, blank);
        }
        configuration.transform(value => value.setIn(found.path, found.value)).notify();
      });
    }
  },

  onInstrumentUpdated(value, keyPath, prevValue) {
    var updated = value.getIn(keyPath);
    if ((updated.node instanceof ListNode) && (updated.node.children instanceof InstrumentRecordNode)) {
      var initial = prevValue.getIn(keyPath);
      this.onRecordListUpdated(updated, initial);
    }
    else if (updated.node instanceof InstrumentSchema.InstrumentRecordNode) {
      var initial = prevValue.getIn(keyPath);

      var prevId = initial.value.get('id');
      var nextId = updated.value.get('id');

      if (prevId && !nextId) {
        this.removeQuestion(prevId);
      }
      else if (!prevId && nextId) {
        this.addQuestion(nextId, updated.value);
      }
      else {
        this.onRecordUpdated(keyPath, updated, initial);
      }
    }

  },

});

module.exports = ChannelStore;
