/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var merge     = require('./merge');
var mergeInto = require('./mergeInto');
var runtime   = require('./runtime');

class StateWriter {

  constructor() {
    this.execute = this.execute.bind(this);
    this.produce = this.produce.bind(this);
    this.merge = this.produce.bind(this);
    // expose produce and merge via bound execute
    this.execute.produce = this.produce;
    this.execute.merge = this.merge;
  }

  produce(value) {
    throw new Error('Not implemented');
  }

  merge(writer) {
    return new MergedStateWriter(this, writer);
  }

  execute(value) {
    var payload = this.produce(value);
    runtime.Actions.pageStateUpdate(payload);
  }

}

class FunctionStateWriter extends StateWriter {

  constructor(producer) {
    super();
    this.producer = producer;
  }

  produce(value) {
    return this.producer(value);
  }
}

class AtomicStateWriter extends StateWriter {

  constructor(id) {
    super();
    this.id = id;
  }

  produce(value) {
    var update = {};
    update[this.id] = value;
    return {
      update,
      persistence: runtime.ApplicationState.getState(this.id).persistence
    };
  }

}

class MergedStateWriter extends StateWriter {

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  produce(value) {
    var x = this.x.produce(value);
    var y = this.y.produce(value);
    var payload = {};
    mergeInto(payload, x);
    mergeInto(payload, y);
    mergeInto(payload, {
      update: merge(
        x.update,
        y.update),
      persistence: mergePersistence(
        x.persistence,
        y.persistence),
      forceRemoteUpdate: (
        x.forceRemoteUpdate
        || y.forceRemoteUpdate),
      includeState: mergeArrays(
        x.includeState,
        y.includeState),
      notificationsOnComplete: mergeArrays(
        x.notificationsOnComplete,
        y.notificationsOnComplete)
    });
    return payload;
  }
}

var PERSISTENCE_ORDER = [
  runtime.ApplicationState.PERSISTENCE.INVISIBLE,
  runtime.ApplicationState.PERSISTENCE.EPHEMERAL,
  runtime.ApplicationState.PERSISTENCE.PERSISTENT
];

function mergePersistence(a, b) {
  aPriority = PERSISTENCE_ORDER.indexOf(a);
  bPriority = PERSISTENCE_ORDER.indexOf(b);
  if (aPriority > bPriority) {
    return a;
  } else if (aPriority <= bPriority) {
    return b;
  }
}

function mergeArrays(a, b) {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return a.concat(b);
}

function mergeStateWriters(a, b) {
  if (
    typeof a.merge === 'function' &&
    typeof b.merge === 'function' &&
    typeof a.produce === 'function' &&
    typeof b.produce === 'function'
  ) {
    return a.merge(b);
  } else {
    return function _dummyMergedStateWriter(value) {
      a(value);
      return b(value);
    }
  }
}

function createStateWriter(id) {
  return new AtomicStateWriter(id).execute;
}

function createStateWriterFromFunction(func) {
  return new FunctionStateWriter(func).execute;
}

module.exports = {
  createStateWriter,
  createStateWriterFromFunction,
  mergeStateWriters
};
