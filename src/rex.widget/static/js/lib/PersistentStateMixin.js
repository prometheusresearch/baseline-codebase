/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var invariant = require('./invariant');

var PersistentStateMixin = {

  getInitialState() {
    var state = _loads(this._getPersistentStateKey());
    if (state === null) {
      if (typeof this.getInitialPersistentState === 'function') {
        state = this.getInitialPersistentState();
      } else {
        state = {};
      }
    }
    return state;
  },

  componentWillMount() {
    invariant(
      this.persistentStateKeys,
      'Component which uses PersistentStateMixin should ' +
      'define persistentStateKeys mapping'
    );
  },

  setPersistentState(state) {
    _dumps(
      this._getPersistentStateKey(),
      _filterState(state, this.persistentStateKeys)
    );
    this.setState(state);
  },

  _getPersistentStateKey() {
    if (typeof this.getPersistentStateKey === 'function') {
      return this.getPersistentStateKey();
    } else if (this.props.id !== undefined) {
      return this.props.id;
    } else {
      return `${this._rootNodeID}__${this._mountDepth}`;
    }
  }
};

function _filterState(state, keys) {
  var nextState = {};
  for (var key in state) {
    if (state.hasOwnProperty(key) && keys[key] !== undefined) {
      nextState[key] = state[key];
    }
  }
  return nextState;
}

function _dumps(key, state) {
  window.localStorage[`__rex_widget__${key}`] = JSON.stringify(state);
}

function _loads(key) {
  try {
    return JSON.parse(window.localStorage[`__rex_widget__${key}`]);
  } catch (_err) {
    return null;
  }
}

module.exports = PersistentStateMixin;
