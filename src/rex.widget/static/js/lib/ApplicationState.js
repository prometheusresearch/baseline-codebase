/**
 * @jsx React.DOM
 */
'use strict';

var request       = require('superagent/superagent');
var ReactUpdates  = require('react/lib/ReactUpdates');
var $             = require('jquery');
require('./jquery-deparam');
var Emitter       = require('emitter');
var invariant     = require('./invariant');
var merge         = require('./merge');
var mergeInto     = require('./mergeInto');

var UNKNOWN = '__unknown__';
var PERSISTENCE = {
  PERSISTENT: 'persistent',
  EPHEMERAL: 'ephemeral',
  INVISIBLE: 'invisible'
};

// a mapping from state ids to states
var storage = {};

// a mapping from state ids to arrays of dependent state ids
var dependents = {};

var preventPopState = false;

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

function forEachReadWriteState(func) {
  Object.keys(storage).forEach(function(key) {
    var state = storage[key];
    if (state.isWritable) {
      func(state, key);
    }
  });
}

function serializeApplicationState() {
  var pathname = window.location.pathname;
  var query = {};
  forEachReadWriteState(function(state, key) {
    if (state.value !== null && state.persistence !== PERSISTENCE.INVISIBLE) {
      query[key] = state.value;
    }
  });
  query = $.param(query);
  if (query.length > 0) {
    pathname = `${pathname}?${query}`;
  }
  return pathname;
}

window.addEventListener('popstate', function() {
  if (preventPopState) {
    preventPopState = false;
    return;
  }
  var update = {};
  var query = $.deparam(window.location.search.slice(1));
  forEachReadWriteState(function(state, key) {
    var value = query[key];
    if (value === '' || value === undefined) {
      value = null;
    }
    update[key] = value;
  });
  ApplicationState.updateMany(update);
});

var ApplicationState = merge({

  UNKNOWN,
  PERSISTENCE,

  replaceHistoryRecord() {
    var pathname = serializeApplicationState();
    window.history.replaceState(null, '', pathname);
  },

  pushHistoryRecord() {
    var pathname = serializeApplicationState();
    window.history.pushState(null, '', pathname);
  },

  getState(id) {
    return storage[id];
  },

  get(id) {
    if (id.indexOf(':') > -1) {
      var parsed = id.split(':', 1);
      id = parsed[0];
      var value = storage[id].value;
      if (value === UNKNOWN) {
        return null;
      }
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
      var value = storage[id].value;
      if (value === UNKNOWN) {
        return null;
      }
      return value;
    }
  },

  hydrateAll(statePacket) {
    ReactUpdates.batchedUpdates(() => {
      Object.keys(statePacket).forEach((id) =>
        this.hydrate(statePacket[id]))
    });
  },

  /**
   * @param {String} id
   * @param {Object} state
   * @param {Array<Strign>} dependencies
   */
  hydrate(stateDescriptor) {
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
        defer: stateDescriptor.defer,
        isWritable: stateDescriptor.isWritable,
        updating: stateDescriptor.updating,
        persistence: stateDescriptor.persistence
      };
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

  updateMany(values) {
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
      } else if (!state.isWritable) {
        state.value = merge(state.value, {updating: true});
        needRemoteUpdate = true;
      }

      toNotify.push(sID);
      queue = queue.concat(dependents[sID] || []);
    }

    storage = nextStorage;

    // notify listeners so that they can show loading indicators if needed
    ReactUpdates.batchedUpdates(() => {
      toNotify.forEach(this.notifyStateChanged, this);
    });

    if (needRemoteUpdate) {
      this.remoteUpdate(values);
    }
  },

  update(id, value) {
    var values = {}
    values[id] = value;
    this.updateMany(values);
  },

  notifyStateChanged(id) {
    this.emit(id, id, storage[id].value);
  },

  remoteReload(id) {
    var update = {};
    for(var dep in dependents) {
      // TODO: fix user handling
      if(dep !== 'USER' && dependents[dep].indexOf(id) != -1) {
        update[dep] = storage[dep].value;
      }
    }
    this.remoteUpdate(update);
  },

  loadDeferred() {
    var updates = {};

    for (var id in storage) {
      var {defer} = storage[id];
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

  remoteUpdate(values) {
    var params = {};

    this.forEach((state, id) => {
      if (state.isWritable && values[id] === undefined) {
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

  _remoteUpdateCompleted(err, response) {
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
    ReactUpdates.batchedUpdates(() => {
      Object.keys(state).forEach(this.notifyStateChanged, this);
    });
    preventPopState = true;
    this.replaceHistoryRecord()
  },

  forEach(func, context) {
    Object.keys(storage).forEach((id) => func.call(context, storage[id], id));
  }

}, Emitter.prototype);


if (__DEV__) {
  ApplicationState.getStorage = function() { return storage; };
  ApplicationState.getDependents = function() { return dependents; };
}


module.exports = ApplicationState;
