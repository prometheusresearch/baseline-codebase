/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Immutable = require('immutable');
var invariant = require('rex-widget/lib/invariant');

class DataSpecification {

  constructor(port, spec) {
    this.port = port || null;
    this.spec = spec || {};
  }

  bindToContext(context) {
    var params = {};
    for (var k in this.spec) {
      var spec = this.spec[k];
      if (spec instanceof Binding) {
        params[k] = spec.bindToContext(context);
      } else {
        params[k] = spec;
      }
    }
    return new this.constructor(this.port, params);
  }

  produceParams() {
    var params = {};
    for (var k in this.spec) {
      var v = this.spec[k];
      invariant(
        (v instanceof Value),
        'trying to produce params from unbound data specification'
      );
      if (v.options.required && v.value == null) {
        return null;
      }
      params[k] = v.value;
    }
    return Immutable.fromJS(params);
  }

  merge(other) {
    invariant(
      this.constructor === other.constructor,
      'DataSpecification.merge(): can only merge same type specifications'
    );
    invariant(
      this.port === other.port || other.port === null || this.port === null,
      'DataSpecification.merge(): can only merge specifications with the same port'
    );
    var spec = {...this.spec, ...other.spec};
    return new this.constructor(this.port || other.port, spec);
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

class StateBinding extends Binding {

  constructor(keyPath, options) {
    super(options);
    this.keyPath = keyPath;
  }

  bindToContext(context) {
    return new Value(context.state[this.keyPath], this.options);
  }
}

class PropBinding extends Binding {

  constructor(keyPath, options) {
    super(options);
    this.keyPath = keyPath;
  }

  bindToContext(context) {
    return new Value(context.props[this.keyPath], this.options);
  }
}

class Value {

  constructor(value, options) {
    this.value = value;
    this.options = options || {};
  }
}

module.exports = {
  DataSpecification, Collection, Entity,
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
  }
};
