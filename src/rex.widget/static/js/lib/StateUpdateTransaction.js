/**
 * @jsx React.DOM
 */
'use strict';

var Promise   = require('bluebird');
var Reference = require('./Reference');
var invariant = require('./invariant');

var STATE = {
  FRESH: 'FRESH',
  STARTED: 'STARTED',
  FINISHED: 'FINISHED',
  ROLLEDBACK: 'ROLLEDBACK'
};

class StateUpdateTransaction {

  constructor(ref, state, value) {
    this.ref = Reference.as(ref);
    this.state = state;
    this.value = value;
    this.prevValue = null;

    this._state = STATE.FRESH;

    if (typeof this.value !== 'function') {
      this.value = function() { return value; };
    }

    invariant(
      this.state.getStates()[this.ref.id] !== undefined,
      'invalid state to update: %s', this.ref.id
    );
  }

  get() {
    return this.state.get(this.ref);
  }

  set(value) {
    var container = this.state.getValues()[this.ref.id];
    invariant(container !== undefined);
    container.value = this.ref.set(container.value, value);
    container.version += 1;
    this.state.notifyStateChanged(this.ref.id);
  }

  begin() {
    invariant(this._state === STATE.FRESH);
    return new Promise((resolve, reject) => {
      this._state = STATE.STARTED;
      this.prevValue = this.state.getValues()[this.ref.id].value;
      Promise.resolve(this.value(this)).then(resolve, reject);
    }).then(
      this.commit.bind(this),
      (err) => {
        this.rollback.bind(this)
        throw err;
      });
  }

  commit() {
    invariant(this._state === STATE.STARTED);
    this._state = STATE.FINISHED;
    this.state.remoteReload(this.ref.id);
    this.prevValue = null;
  }

  rollback() {
    invariant(this._state === STATE.STARTED);
    this._state = STATE.ROLLEDBACK;
    var valueContainer = this.state.getValues()[this.ref.id];
    valueContainer.value = this.prevValue;
    this.state.notifyStateChanged(this.ref.id);
    this.prevValue = null;
  }

}

module.exports = StateUpdateTransaction;
