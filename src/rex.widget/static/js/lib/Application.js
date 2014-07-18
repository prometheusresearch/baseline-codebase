/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react');
var ApplicationState  = require('./ApplicationState');

var Application = React.createClass({

  propTypes: {
    stateIDs: React.PropTypes.array,
    widget: React.PropTypes.object.isRequired
  },

  render: function() {
    return constructComponent(this.props.widget);
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
 * @param {Widget} widget
 * @param {Number|String} key
 * @returns {ReactDescriptor}
 */
function constructComponent(widget, key) {
  if (widget.__type__ === undefined) {
    throw new Error('widget should have "__type__" attribute');
  }

  if (widget.props === undefined) {
    throw new Error('widget should have "props" attribute');
  }

  var props = {};

  if (key !== undefined) {
    props.key = key;
  }

  for (var name in widget.props) {
    var prop = widget.props[name];
    // Widget
    if (prop !== null && prop.__type__) {
      props[name] = constructComponent(prop);
    // An array of widgets
    } else if (prop !== null && prop.__children__) {
      props[name] = prop.__children__.map(function(child, key) {
        return constructComponent(child, key);
      });
    // Read from state
    } else if (prop !== null && prop.__state_read__) {
      props[name] = ApplicationState.get(prop.__state_read__);
    // Write to state
    } else if (prop !== null && prop.__state_read_write__) {
      props[name] = ApplicationState.get(prop.__state_read_write__);
      props[stateWriterName(name)] = makeStateWriter(prop.__state_read_write__);
    } else {
      props[name] = prop;
    }
  }

  var Component = __require__(widget.__type__);
  return Component(props);
}

function stateWriterName(name) {
  return 'on' + name[0].toUpperCase() + name.slice(1);
}

function makeStateWriter(id) {
  return function(value) {
    ApplicationState.update(id, value);
  }
}

module.exports = Application;
