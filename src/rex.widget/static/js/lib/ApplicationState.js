/**
 * @jsx React.DOM
 */
'use strict';

var request       = require('superagent/superagent');
var ReactUpdates  = require('react/lib/ReactUpdates');
var Emitter       = require('emitter');
var invariant     = require('./invariant');
var merge         = require('./merge');
var mergeInto     = require('./mergeInto');
var History       = require('./History');

var UNKNOWN = '__unknown__';
var PERSISTENCE = {
  PERSISTENT: 'persistent',
  EPHEMERAL: 'ephemeral',
  INVISIBLE: 'invisible'
};

// a mapping from state ids to state configurations
var states = undefined;
// a mapping from state ids to arrays of dependent state ids
var dependents = {};
// a mapping from state ids to state values
var values = {};

function mergeValue(value, update) {
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

  PERSISTENCE,

  /**
   * Start application.
   *
   * @param {State} state
   * @param {Values} values
   */
  start(state, values) {
    this.configure(state);
    this.hydrate(values);
    this.loadDeferred();
  },

  /**
   * Update applicaiton state
   *
   * @param {State} states
   */
  configure(conf) {
    invariant(
      states === undefined,
      'state is already configured'
    );
    states = {};
    Object.keys(conf).forEach((id) => this._configureState(conf[id]));
  },

  _configureState(state) {
    var {id, dependencies} = state;
    states[id] = state;
    values[id] = {value: UNKNOWN, updating: !!state.defer};
    // TODO: Check for cycles.
    if (dependencies.length > 0) {
      dependencies.forEach(function(dep) {
        var list = dependents[dep] = dependents[dep] || [];
        if (dependents[dep].indexOf(id) === -1) {
          dependents[dep].push(id);
        }
      });
    }
  },

  getState(id) {
    if (id.indexOf(':') > -1) {
      id = id.split(':', 1)[0];
    }
    var state = states[id];
    invariant(
      state !== undefined,
      `no state with id "${id}" found`
    );
    return state;
  },

  getValue(id) {
    var value = values[id];
    invariant(
      value !== undefined,
      `no value for state id "${id}" found`
    );
    return value;
  },

  get(id) {
    if (id.indexOf(':') > -1) {
      var parsed = id.split(':', 1);
      id = parsed[0];
      var value = values[id].value;
      if (value === UNKNOWN) {
        return null;
      }
      invariant(
        states[id] !== undefined,
        `cannot dereference state with id: ${id}`
      );
      parsed[1].split('.').forEach((part) => value = value[part]);
      return value;
    } else {
      invariant(
        states[id] !== undefined,
        `cannot dereference state with id: ${id}`
      );
      var value = values[id].value;
      if (value === UNKNOWN) {
        return null;
      }
      return value;
    }
  },

  hydrate(update) {
    var nextValues = {};
    mergeInto(nextValues, values);
    ReactUpdates.batchedUpdates(() => {
      Object.keys(update).forEach((id) => {
        var value = update[id];

        invariant(
          states[id] !== undefined,
          "unknown state '%s'", id
        );

        var prevValue = nextValues[id];

        if (prevValue !== undefined && prevValue.value !== UNKNOWN) {
          nextValues[id] = {
            value: mergeValue(prevValue.value, value),
            updating: false
          };
        } else {
          nextValues[id] = {
            value,
            updating: false
          };
        }
      });

      values = nextValues;
    });
  },

  /**
   * Update multiple states at once.
   */
  updateMany(update) {
    var nextValues = {};
    mergeInto(nextValues, values);

    var queue = Object.keys(update);
    var toNotify = [];

    var needRemoteUpdate = false;

    while (queue.length > 0) {
      var sID = queue.shift();
      var state = states[sID];

      invariant(
        state !== undefined,
        'unknown state to update: "%s"', sID
      );

      // XXX: If we would need some sophisticated state management, this is the
      // place where we can dispatch update to state's store so it can process
      // it in some way
      if (update[sID] !== undefined) {
        nextValues[sID] = {value: update[sID], updating: false};
      } else if (!state.isWritable) {
        nextValues[sID] = {value: values[sID].value, updating: true};
        needRemoteUpdate = true;
      }

      toNotify.push(sID);
      queue = queue.concat(dependents[sID] || []);
    }

    values = nextValues;

    // notify listeners so that they can show loading indicators if needed
    ReactUpdates.batchedUpdates(() => {
      toNotify.forEach(this.notifyStateChanged, this);
    });

    if (needRemoteUpdate) {
      this.remoteUpdate(update);
    }
  },

  update(id, value) {
    var update = {}
    update[id] = value;
    this.updateMany(update);
  },

  notifyStateChanged(id) {
    this.emit(id, id, values[id].value);
  },

  remoteReload(id) {
    var update = {};
    for (var dep in dependents) {
      // TODO: fix user handling
      if (dep !== 'USER' && dependents[dep].indexOf(id) != -1) {
        update[dep] = values[dep].value;
      }
    }
    this.remoteUpdate(update);
  },

  loadDeferred() {
    var updates = {};

    for (var id in states) {
      var {defer} = states[id];
      if (defer !== null) {
        var update = updates[defer] || {};
        update[id] = UNKNOWN;
        updates[defer] = update;
      }
    }

    if (Object.keys(updates).length > 0) {
      for (var group in updates) {
        this.remoteUpdate(updates[group]);
      }
    }
  },

  remoteUpdate(update) {
    var params = {};

    this.forEach((state, id, {value}) => {
      if (state.isWritable && update[id] === undefined) {
        params[id] = value;
      }
    });

    Object.keys(update).forEach((id) => {
      params[`update:${id}`] = update[id];
    });

    request
      .post(window.location.pathname)
      .send(params)
      .set('Accept', 'application/json')
      .end(this._remoteUpdateCompleted.bind(this));
  },

  _remoteUpdateCompleted(err, response) {
    // FIXME: We need to do proper error handling instead: store error in state
    // so UI can render appropriate message
    if (err) {
      throw err;
    }

    if (response.status !== 200) {
      throw new Error(`cannot update state: ${response.text}`);
    }

    var values = response.body.values;
    this.hydrate(values);
    ReactUpdates.batchedUpdates(() => {
      Object.keys(values).forEach(this.notifyStateChanged, this);
    });
    this.history.replaceState();
  },

  forEach(func, context) {
    Object.keys(states).forEach((id) =>
      func.call(context, states[id], id, values[id]));
  }

}, Emitter.prototype);

ApplicationState.history = new History(ApplicationState);


if (__DEV__) {
  ApplicationState.getStates = function() { return states; };
  ApplicationState.getDependents = function() { return dependents; };
  ApplicationState.getValues = function() { return values; };
}


module.exports = ApplicationState;
