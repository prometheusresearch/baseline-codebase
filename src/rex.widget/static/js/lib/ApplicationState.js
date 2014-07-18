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
var states = {};

// a mapping from state ids to arrays of dependent state ids
var dependents = {};

var ApplicationState = merge({

  get: function(id) {
    var state = states[id];
    invariant(
      state !== undefined,
      'cannot dereference state by id "%s"', id
    );
    return state.value;
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

    if (states[id] !== undefined) {
      states[id] = merge(states[id], {value});
    } else {
      states[id] = {value, remote: stateDescriptor.remote, updating: false};
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

  update: function(id, value) {
    var newStates = merge({}, states);

    var queue = [id];
    var toNotify = [];

    var needRemoteUpdate = false;

    while (queue.length > 0) {
      var sID = queue.shift();

      // XXX: If we would need some sophisticated state management, this is the
      // place where we can dispatch update to state's store so it can process
      // it in some way
      if (sID === id) {
        newStates[sID].value = value;
      } else if (newStates[sID].remote) {
        newStates[sID].value = merge(newStates[sID].value, {updating: true});
        needRemoteUpdate = true;
      }

      toNotify.push(sID);
      queue = queue.concat(dependents[sID] || []);
    }

    states = newStates;

    // notify listeners so that they can show loading indicators if needed
    toNotify.forEach(this.notifyStateChanged, this);

    if (needRemoteUpdate) {
      this.remoteUpdate(id, value);
    }
  },

  notifyStateChanged: function(id) {
    console.debug('state changed:', id);
    this.emit(id, id, states[id].value);
  },

  remoteUpdate: function(id, value) {

    var params = {};

    this.forEach((state, stateID) => {
      if (!state.remote && id !== stateID) {
        params[stateID] = state.value;
      }
    });

    params[`update:${id}`] = value

    console.log(params);

    request
      .post(window.location.pathname)
      .type('form')
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
    Object.keys(states).forEach((id) => func.call(context, states[id], id));
  }

}, Emitter.prototype);


if (__DEV__) {
  ApplicationState.states = states;
  ApplicationState.dependents = dependents;
}


module.exports = ApplicationState;
