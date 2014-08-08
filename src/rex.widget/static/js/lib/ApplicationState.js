/**
 * @jsx React.DOM
 */
'use strict';

var request     = require('superagent/superagent');
var qs          = require('qs');
var Emitter     = require('emitter');
var invariant   = require('./invariant');
var merge       = require('./merge');
var mergeInto   = require('./mergeInto');

// a mapping from state ids to states
var storage = {};

// a mapping from state ids to arrays of dependent state ids
var dependents = {};

function updateStateValue(value, update) {
  // If this is an object we should process update directives, otherwise we just
  // replace value with an updated one
  if (typeof update === 'object' && update !== null) {

    var updatedValue = {};
    mergeInto(updatedValue, value);

    Object.keys(update).forEach(function(key) {
      var val = update[key];
      if (val && val.__append__) {
        invariant(
          value === undefined || Array.isArray(updatedValue[key]),
          '__append__ directive only allowed on arrays'
        );

        updatedValue[key] = (updatedValue[key] || []).concat(val.__append__);
      } else {
        updatedValue[key] = val;
      }
    });

    return updatedValue;
  } else {
    return update;
  }
}

var ApplicationState = merge({

  get: function(id) {
    if (id.indexOf(':') > -1) {
      var parsed = id.split(':', 1);
      id = parsed[0];
      var value = storage[id].value;
      invariant(
        storage[id] !== undefined,
        `cannot dereference state with id: ${id}`
      );
      parsed[1].split('.').forEach((part) => value = value[part]);
      return value;
    } else {
      invariant(
        storage[id] !== undefined,
        `cannot dereference state with id: ${id}`
      );
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

    var prevState = storage[id];

    if (prevState !== undefined) {
      storage[id] = merge(prevState, {
        value: updateStateValue(prevState.value, value)
      });
    } else {
      storage[id] = {
        value: updateStateValue(undefined, value),
        rw: stateDescriptor.rw,
        updating: stateDescriptor.updating
      };
    }
    console.debug('hydrated ', id, storage[id].value);

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
    console.debug('updateMany', values);
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
      } else if (!state.rw) {
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
      if (state.rw && values[id] === undefined) {
        params[id] = state.value;
      }
    });

    Object.keys(values).forEach((id) => {
      params[`update:${id}`] = values[id];
    });

    console.debug('remote update with', params);

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
  ApplicationState.getStorage = function() { return storage; };
  ApplicationState.getDependents = function() { return dependents; };
}


module.exports = ApplicationState;
