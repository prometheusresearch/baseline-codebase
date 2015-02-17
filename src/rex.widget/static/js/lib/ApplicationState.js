/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var request                = require('superagent/superagent');
var React                  = require('react/addons');
var batchedUpdates         = React.addons.batchedUpdates;
var Emitter                = require('emitter');
var invariant              = require('./invariant');
var merge                  = require('./merge');
var mergeInto              = require('./mergeInto');
var History                = require('./History');
var Reference              = require('./Reference');
var StateUpdateTransaction = require('./StateUpdateTransaction');
var Actions                = require('./runtime/Actions');
var ActionTypes            = require('./runtime/ActionTypes');

var UNKNOWN = '__unknown__';

var PERSISTENCE = {
  PERSISTENT: 'persistent',
  EPHEMERAL: 'ephemeral',
  INVISIBLE: 'invisible'
};

class ApplicationState extends Emitter {

  constructor(dispatcher) {
    dispatcher.register(this._onAction.bind(this));
    // a mapping from state ids to state configurations
    this.states = undefined;
    // a mapping from state ids to arrays of dependent state ids
    this.dependents = {};
    // a mapping from state ids to state values
    this.values = {};
  }

  _onAction(action) {
    switch (action.type) {
      case ActionTypes.PAGE_INIT:
        var {stateDescriptor, state, versions} = action.payload;
        this._onPageInit(stateDescriptor, state, versions);
        break;
      case ActionTypes.PAGE_STATE_UPDATE_COMPLETE:
        var {payload: {state, versions}, stateOverride} = action.payload;
        state = {...state, ...stateOverride};
        this._onPageStateUpdateComplete(state, versions);
        break;
      case ActionTypes.PAGE_STATE_UPDATE:
        this._onPageStateUpdate(action.payload);
        break;
    }
  }

  _onPageStateUpdate({update, forceRemoteUpdate, includeState, onSuccess, notificationsOnComplete}) {
    this.updateMany(update, {
      forceRemoteUpdate,
      includeState,
      notificationsOnComplete,
      onSuccess
    });
  }

  _onPageStateUpdateComplete(state, versions) {
    this.hydrate(state, versions, true);
    batchedUpdates(() => {
      Object.keys(state).forEach(this.notifyStateChanged, this);
    });
  }

  _onPageInit(stateDescriptor, state, versions) {
    this.configure(stateDescriptor);
    this.hydrate(state, versions, false);
    this.loadDeferred();
  }

  /**
   * Update applicaiton state
   *
   * @param {State} states
   */
  configure(conf) {
    invariant(
      this.states === undefined,
      'state is already configured'
    );
    this.states = {};
    Object.keys(conf).forEach((id) => this._configureState(conf[id]));
  }

  _configureState(state) {
    var {id, dependencies} = state;
    var managerClass;
    if (state.manager) {
      managerClass = __require__(state.manager);
    } else {
      managerClass = require('./StateManager');
    }
    state.manager = new managerClass(this, state);
    this.states[id] = state;
    this.values[id] = {
      id,
      value: UNKNOWN,
      updating: state.defer != null,
      version: 0
    };
    // TODO: Check for cycles.
    if (dependencies.length > 0) {
      dependencies.forEach(dep => {
        var list = this.dependents[dep] = this.dependents[dep] || [];
        if (this.dependents[dep].indexOf(id) === -1) {
          this.dependents[dep].push(id);
        }
      });
    }
  }

  getState(id) {
    if (id.indexOf(':') > -1) {
      id = id.split(':', 1)[0];
    }
    var state = this.states[id];
    invariant(
      state !== undefined,
      `no state with id "${id}" found`
    );
    return state;
  }

  getValue(id) {
    var value = this.values[id];
    invariant(
      value !== undefined,
      `no value for state id "${id}" found`
    );
    return value;
  }

  get(ref) {
    ref = Reference.as(ref);
    invariant(
      this.states[ref.id] !== undefined,
      `cannot dereference state by ref: ${ref}`
    );

    var value = this.values[ref.id].value;

    if (value === UNKNOWN) {
      return null;
    }

    if (ref.path.length > 0) {
      for (var i = 0, len = ref.path.length; i < len; i++) {
        if (value === null || value === undefined) {
          return value;
        }
        if (value[ref.path[i]] !== undefined) {
          value = value[ref.path[i]];
        } else if (typeof value.get === 'function') {
          value = value.get(ref.path[i]);
        } else {
          value = undefined;
        }
      }
    }

    return value;
  }

  hydrate(update, versions, remote) {
    var nextValues = {};
    mergeInto(nextValues, this.values);
    batchedUpdates(() => {
      Object.keys(update).forEach((id) => {
        var value = update[id];
        var version = versions[id];
        var state = this.states[id];

        invariant(
          state !== undefined,
          "unknown state '%s'", id
        );

        invariant(version !== undefined);

        if (nextValues[id].version <= version) {
          var prevValue = nextValues[id].value;
          nextValues[id] = merge(nextValues[id], {
            id,
            value: state.manager.hydrate(nextValues[id].value, value),
            version
          });

          if (remote) {
            nextValues[id].remote = false;
            nextValues[id].updating = false;
          }
        } else {
          console.debug(
            'skipping state hydration', id,
            'versions', nextValues[id].version, version
          );
        }
      });
      this.values = nextValues;
    });
  }

  /**
   * Update multiple states at once.
   */
  updateMany(update, options) {
    options = options || {};
    var nextValues = {};
    mergeInto(nextValues, this.values);

    var queue = Object.keys(update);
    var toNotify = [];

    var needRemoteUpdate = !!options.forceRemoteUpdate;

    while (queue.length > 0) {
      var sID = queue.shift();
      var state = this.states[sID];
      var version = nextValues[sID].version;

      invariant(
        state !== undefined,
        'unknown state to update: "%s"', sID
      );

      // XXX: If we would need some sophisticated state management, this is the
      // place where we can dispatch update to state's store so it can process
      // it in some way
      if (update[sID] !== undefined) {
        version = version + 1;
        nextValues[sID] = state.manager.update(
          nextValues[sID], {value: update[sID], updating: false});
      } else if (!state.isWritable) {
        nextValues[sID] = state.manager.updateWritable(
          nextValues[sID], {value: this.values[sID].value, updating: true});
        needRemoteUpdate = true;
      }

      toNotify.push(sID);
      queue = queue.concat(this.dependents[sID] || []);
    }

    this.values = nextValues;

    // notify listeners so that they can show loading indicators if needed
    batchedUpdates(() => {
      toNotify.forEach(this.notifyStateChanged, this);
    });

    if (needRemoteUpdate) {
      this.remoteUpdate(update, options);
    }
  }

  update(id, value, options) {
    var update = {}
    update[id] = value;
    this.updateMany(update, options);
  }

  createUpdateTransaction(ref, func) {
    ref = Reference.as(ref);
    return new StateUpdateTransaction(ref, this, func);
  }

  notifyStateChanged(id) {
    this.emit(id, id, this.values[id].value);
  }

  remoteReload(ids) {
    if (!(ids instanceof Array)) {
      ids = [ids];
    }
    var update = {};
    ids.map((id) => {
      for (var dep in this.dependents) {
        // TODO: fix user handling
        if (dep !== 'USER' && this.dependents[dep].indexOf(id) != -1) {
          update[dep] = this.values[dep].value;
        }
      }
    });
    this.remoteUpdate(update);
  }

  loadDeferred() {
    var updates = {};

    for (var id in this.states) {
      var {defer} = this.states[id];
      if (defer != null) {
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
  }

  remoteUpdate(update, options) {
    options = options || {};

    var includeState = options.includeState || [];

    var values = {};
    var updates = {};
    var versions = {};

    this.forEach((state, id, {value, version}) => {
      versions[id] = version;
      if (state.isWritable && update[id] === undefined || includeState.indexOf(id) > -1) {
        values[id] = value;
      }
    });

    Object.keys(update).forEach((id) => {
      var state = this.states[id];
      updates[id] = state.manager.prepareUpdate(update[id]);
    });

    request
      .post(window.location.pathname)
      .send({values, updates, versions})
      .set('Accept', 'application/json')
      .end(this._onRemoteUpdateComplete.bind(this, options));
  }

  _onRemoteUpdateComplete(options, err, response) {
    if (err) {
      Actions.pageStateUpdateError(err);
    } else if (response.status !== 200) {
      var err = new Error(`cannot update state: ${response.text}`);
      Actions.pageStateUpdateError(err);
    } else {
      Actions.pageStateUpdateComplete(
        response.body,
        options.notificationsOnComplete,
        options.onSuccess
      );
    }
  }

  forEach(func, context) {
    Object.keys(this.states).forEach((id) =>
      func.call(context, this.states[id], id, this.values[id]));
  }

  getStates() {
    return this.states;
  }

  getDependents() {
    return this.dependents;
  }

  getValues() {
    return this.values;
  }

}

ApplicationState.prototype.PERSISTENCE = PERSISTENCE;
ApplicationState.prototype.UNKNOWN = UNKNOWN;

module.exports = ApplicationState;
