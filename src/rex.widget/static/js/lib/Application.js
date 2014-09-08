/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react');
var ApplicationState  = require('./ApplicationState');
var invariant         = require('./invariant');
var merge             = require('./merge');
var Reference         = require('./Reference');
var Data              = require('./Data');

var Application = React.createClass({

  propTypes: {
    listenTo: React.PropTypes.array,
    ui: React.PropTypes.object.isRequired
  },

  render() {
    return constructComponent(this.props.ui);
  },

  getDefaultProps() {
    return {listenTo: []};
  },

  componentDidMount() {
    this._setupStateListeners(this.props.listenTo);
  },

  componentWillUmount() {
    this._removeStateListeners(this.props.listenTo);
  },

  _removeStateListeners(listenTo) {
    for (var i = 0, len = listenTo.length; i < len; i++) {
      ApplicationState.off(listenTo[i], this.update);
    }
  },

  _setupStateListeners(listenTo) {
    for (var i = 0, len = listenTo.length; i < len; i++) {
      ApplicationState.on(listenTo[i], this.update);
    }
  },

  /**
   * Force update of the application UI.
   *
   * The method forceUpdate() isn't automatically bound to a component instance but
   * user-defined methods are. This is why we need to use `this.update` instead
   * of `this.forceUpdate` when registering callbacks.
   */
  update() {
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
      props[name] = readState(prop.__state_read__);
    // Write to state
    } else if (prop !== null && prop.__state_read_write__) {
      var stateID = prop.__state_read_write__;
      var state = ApplicationState.getState(stateID);
      props[name] = ApplicationState.get(stateID);
      props[stateWriterName(name)] = makeAction(stateID, state.persistence);
    } else {
      props[name] = prop;
    }
  }

  var Component = __require__(ui.__type__);
  return Component(props);
}

function readState(ref) {
  // XXX: think of a better to pass updating flag to widget
  var state = ApplicationState.getState(ref);
  ref = Reference.as(ref);
  if (ref.path.length > 0) {
    // if this is deep reference we just dereference it
    return ApplicationState.get(ref);
  } else {
    // if this state read we also include updating state
    var {value, updating} = ApplicationState.getValue(ref.id);
    if (value === null || value === ApplicationState.UNKNOWN) {
      return null
    } else {
      return new Data(merge(value, {updating}));
    }
  }
}

function stateWriterName(name) {
  return 'on' + name[0].toUpperCase() + name.slice(1);
}

function makeAction(id, persistence) {
  function produce(value) {
    var update = {};
    update[id] = value;
    return update;
  }

  function execute(value, options) {
    options = options || {};
    ApplicationState.updateMany(produce(value), options);
    var updatePersistence = options.persistence || persistence;
    switch (updatePersistence) {
      case ApplicationState.PERSISTENCE.PERSISTENT:
        ApplicationState.history.pushState();
        break;
      case ApplicationState.PERSISTENCE.EPHEMERAL:
        ApplicationState.history.replaceState();
        break;
      case ApplicationState.PERSISTENCE.INVISIBLE:
        break;
      default:
        invariant(
          false,
          "Invalid persistence configuration for state '%s': %s",
          updatePersistence 
        );
    }
  }

  execute.produce = produce;
  execute.execute = execute;

  return execute;
}

module.exports = Application;
