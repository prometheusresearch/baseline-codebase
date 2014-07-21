/**
 * @jsx React.DOM
 */
'use strict';

var request     = require('superagent/superagent');
var qs          = require('qs');
var Emitter     = require('emitter');
var invariant   = require('./invariant');
var merge       = require('./merge');

// a mapping from state ids to states
var storage = {};

// a mapping from state ids to arrays of dependent state ids
var dependents = {};

var ApplicationState = merge({

  get: function(id) {
    if (id.indexOf(':') > -1) {
      var parsed = id.split(':', 1);
      var value = storage[parsed[0]].value;
      parsed[1].split('.').forEach((part) => value = value[part]);
      return value;
    } else {
      return storage[id].value;
    }
  },

  hydrateAll: function(statePacket) {
    Object.keys(statePacket).forEach((id) =>
      this.hydrate(statePacket[id]))
  },

  /**
   * @param {String} id
   * @param {Object} state
   * @param {Array<Strign>} dependencies
   */
  hydrate: function(stateDescriptor) {

    var id = stateDescriptor.id;
    var value = stateDescriptor.value;
    var dependencies = stateDescriptor.dependencies || [];

    if (storage[id] !== undefined) {
      storage[id] = merge(storage[id], {value});
    } else {
      storage[id] = {value, remote: stateDescriptor.remote, updating: false};
    }

    // TODO: Check for cycles.
    if (dependencies.length > 0) {
      dependencies.forEach(function(dep) {
        var toUpdate = dependents[dep] = dependents[dep] || [];
        if (toUpdate.indexOf(id) === -1) {
          toUpdate.push(id);
        }
      });
    }
  },

  updateMany: function(values) {
    var nextStorage = merge({}, storage);

    var queue = Object.keys(values);
    var toNotify = [];

    var needRemoteUpdate = false;

    while (queue.length > 0) {
      var sID = queue.shift();
      var state = nextStorage[sID];

      // XXX: If we would need some sophisticated state management, this is the
      // place where we can dispatch update to state's store so it can process
      // it in some way
      if (values[sID] !== undefined) {
        state.value = values[sID];
      } else if (state.remote) {
        state.value = merge(state.value, {updating: true});
        needRemoteUpdate = true;
      }

      toNotify.push(sID);
      queue = queue.concat(dependents[sID] || []);
    }

    storage = nextStorage;

    // notify listeners so that they can show loading indicators if needed
    toNotify.forEach(this.notifyStateChanged, this);

    if (needRemoteUpdate) {
      this.remoteUpdate(values);
    }
  },

  update: function(id, value) {
    var values = {}
    values[id] = value;
    this.updateMany(values);
  },

  notifyStateChanged: function(id) {
    this.emit(id, id, storage[id].value);
  },

  remoteUpdate: function(values) {

    var params = {};

    this.forEach((state, id) => {
      if (!state.remote && values[id] === undefined) {
        params[id] = state.value;
      }
    });

    Object.keys(values).forEach((id) => {
      params[`update:${id}`] = values[id];
    });

    request
      .post(window.location.pathname)
      .send(params)
      .set('Accept', 'application/json')
      .end(this._remoteUpdateCompleted.bind(this));
  },

  _remoteUpdateCompleted: function(err, response) {
    // FIXME: We need to do proper error handling instead: store error in state
    // so UI can render appropriate message
    if (err) {
      throw err;
    }
    if (response.status !== 200) {
      throw new Error(`cannot update state: ${response.text}`);
    }

    var state = response.body.state;
    this.hydrateAll(state);
    Object.keys(state).forEach(this.notifyStateChanged, this);
  },

  forEach: function(func, context) {
    Object.keys(storage).forEach((id) => func.call(context, storage[id], id));
  }

}, Emitter.prototype);


if (__DEV__) {
  ApplicationState.storage = storage;
  ApplicationState.dependents = dependents;
}


module.exports = ApplicationState;
