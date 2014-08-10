/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react');
var ApplicationState  = require('./ApplicationState');

var Application = React.createClass({

  propTypes: {
    stateIDs: React.PropTypes.array,
    ui: React.PropTypes.object.isRequired
  },

  render: function() {
    return constructComponent(this.props.ui);
  },

  getDefaultProps: function() {
    return {stateIDs: []};
  },

  componentDidMount: function() {
    this._setupStateListeners(this.props.stateIDs);
  },

  componentDidUpdate: function(prevProps) {
    this._removeStateListeners(prevProps.stateIDs);
    this._setupStateListeners(this.props.stateIDs);
  },

  componentWillUmount: function() {
    this._removeStateListeners(this.props.stateIDs);
  },

  _removeStateListeners: function(stateIDs) {
    for (var i = 0, len = stateIDs.length; i < len; i++) {
      ApplicationState.off(stateIDs[i], this._update);
    }
  },

  _setupStateListeners: function(stateIDs) {
    for (var i = 0, len = stateIDs.length; i < len; i++) {
      ApplicationState.on(stateIDs[i], this._update);
    }
  },

  // XXX: forceUpdate() method isn't bound to component, this is why we have
  // _update() and because we might want to do something more interesting in the
  // future.
  _update: function() {
    this.forceUpdate();
  }
});

/**
 * Constructor React Component Descriptor from Rex Widget
 *
 * @private
 *
 * @param {Widget} ui
 * @param {Number|String} key
 * @returns {ReactDescriptor}
 */
function constructComponent(ui, key) {
  if (ui.__type__ === undefined) {
    throw new Error('ui should have "__type__" attribute');
  }

  if (ui.props === undefined) {
    throw new Error('ui should have "props" attribute');
  }

  var props = {};

  if (key !== undefined) {
    props.key = key;
  }

  for (var name in ui.props) {
    var prop = ui.props[name];
    // Widget
    if (prop !== null && prop.__type__) {
      props[name] = constructComponent(prop);
    // An array of widgets
    } else if (prop !== null && prop.__children__) {
      props[name] = prop.__children__.map(function(child, key) {
        return constructComponent(child, key);
      });
    // js value reference
    } else if (prop !== null && prop.__reference__) {
      props[name] = __require__(prop.__reference__);
    // Read from state
    } else if (prop !== null && prop.__state_read__) {
      props[name] = ApplicationState.get(prop.__state_read__);
    // Write to state
    } else if (prop !== null && prop.__state_read_write__) {
      var stateID = prop.__state_read_write__;
      var state = ApplicationState.getState(stateID);
      props[name] = ApplicationState.get(stateID);
      props[stateWriterName(name)] = makeAction(stateID, state.isEphemeral);
    } else {
      props[name] = prop;
    }
  }

  var Component = __require__(ui.__type__);
  return Component(props);
}

function stateWriterName(name) {
  return 'on' + name[0].toUpperCase() + name.slice(1);
}

function makeAction(id, isEphemeral) {
  function produce(value) {
    var update = {};
    update[id] = value;
    return update;
  }

  function execute(value) {
    ApplicationState.updateMany(produce(value));
    if (isEphemeral) {
      ApplicationState.replaceHistoryRecord();
    } else {
      ApplicationState.pushHistoryRecord();
    }
  }

  execute.produce = produce;
  execute.execute = execute;

  return execute;
}

module.exports = Application;
