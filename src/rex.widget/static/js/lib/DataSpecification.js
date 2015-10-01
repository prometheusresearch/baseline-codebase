/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

let Immutable = require('immutable');
let invariant = require('./invariant');
let valueOf   = require('./valueOf');

let CANCEL_ON_UPDATE = 'CANCEL_ON_UPDATE';
let QUEUE_ON_UPDATE = 'QUEUE_ON_UPDATE';

let DEFAULT_OPTIONS = {
  strategy: CANCEL_ON_UPDATE
};

class DataSpecification {

  constructor(port, spec, options) {
    this.port = port || null;
    this.spec = spec || {};
    this.options = {...DEFAULT_OPTIONS, ...options};
  }

  bindToContext(context) {
    let params = {};
    for (let key in this.spec) {
      if (!this.spec.hasOwnProperty(key)) {
        continue;
      }
      let spec = this.spec[key];
      if (spec instanceof Binding) {
        params = {...params, ...spec.bindToContext(context, key)};
      } else {
        params[key] = spec;
      }
    }
    return new this.constructor(this.port, params, this.options);
  }

  produceParams() {
    let params = {};
    for (let k in this.spec) {
      if (!this.spec.hasOwnProperty(k)) {
        continue;
      }
      let v = this.spec[k];
      invariant(
        !(v instanceof Binding),
        'trying to produce params from unbound data specification'
      );
      let required = v && v.options && v.options.required;
      let value = valueOf(v);
      if (required && value == null) {
        return null;
      }
      params[k] = value;
    }
    return Immutable.fromJS(params);
  }

  merge(other) {
    if (other.constructor === Object) {
      return new this.constructor(this.port, {...this.spec, ...other}, this.options);
    } else {
      invariant(
        this.constructor === other.constructor,
        'DataSpecification.merge(): can only merge same type specifications'
      );
      invariant(
        this.port === other.port || other.port === null || this.port === null,
        'DataSpecification.merge(): can only merge specifications with the same port'
      );
      let spec = {...this.spec, ...other.spec};
      let options = {...this.options, ...other.options};
      return new this.constructor(this.port || other.port, spec, options);
    }
  }
}

class Collection extends DataSpecification {

}

class Entity extends DataSpecification {

}

class Binding {

  constructor(options) {
    this.options = options || {};
  }
}

class ComputedBinding extends Binding {

  constructor(func, options) {
    super(options);
    this.func = func;
  }

  bindToContext(context, key) {
    let bind = {};
    bind[key] = new Value(this.func(context.props, context.state), this.options);
    return bind;
  }
}

function getByKeyPath(obj, keyPath) {
  if (!Array.isArray(keyPath)) {
    keyPath = keyPath.split('.').filter(Boolean);
  }
  for (let i = 0; i < keyPath.length; i++) {
    if (!obj) {
      return obj;
    }
    obj = obj[keyPath[i]];
  }
  return obj;
}


class StateBinding extends Binding {

  constructor(keyPath, options) {
    super(options);
    this.keyPath = keyPath;
  }

  bindToContext(context, key) {
    let bind = {};
    bind[key] = new Value(getByKeyPath(context.state, this.keyPath), this.options);
    return bind;
  }
}

class PropBinding extends Binding {

  constructor(keyPath, options) {
    super(options);
    this.keyPath = keyPath;
  }

  bindToContext(context, key) {
    let bind = {};
    bind[key] = new Value(getByKeyPath(context.props, this.keyPath), this.options);
    return bind;
  }
}

class Value {

  constructor(value, options) {
    if (value && value.valueOf) {
      value = value.valueOf();
    }
    this.value = value;
    this.options = options || {};
  }

  valueOf() {
    return this.value;
  }
}

module.exports = {
  DataSpecification, Collection, Entity,
  CANCEL_ON_UPDATE, QUEUE_ON_UPDATE,
  Binding, StateBinding, PropBinding,
  Value,

  /**
   * Collection specification.
   */
  collection(spec) {
    return new Collection(null, spec);
  },

  /**
   * Entity specification.
   */
  entity(spec) {
    return new Entity(null, spec);
  },

  /**
   * State binding specification.
   */
  state(keyPath, options) {
    return new StateBinding(keyPath, options);
  },

  /**
   * Prop binding specification.
   */
  prop(keyPath, options) {
    return new PropBinding(keyPath, options);
  },

  computed(func, options) {
    return new ComputedBinding(func, options);
  }
};
