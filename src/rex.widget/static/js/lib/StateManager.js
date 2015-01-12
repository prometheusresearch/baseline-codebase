/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var mergeInto = require('./mergeInto');
var merge = require('./merge');
var runtime = require('./runtime');

function mergeValue(value, update) {
  // If this is an object we should process update directives, otherwise we just
  // replace value with an updated one
  if (typeof update === 'object'
      && update !== null
      && value !== runtime.ApplicationState.UNKNOWN) {
    var updatedValue = Array.isArray(value) ? []:{};
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


class StateManager {

  constructor(applicationState, state) {
    this.applicationState = applicationState;
    this.state = state;
  }

  prepareUpdate(value) {
    return value;
  }

  hydrate(value, update) {
    return mergeValue(value, update);
  }

  update(value, update) {
    return merge(value, update);
  }

  updateWritable(value, update) {
    return merge(value, update);
  }

  set(value, options) {
    return this.applicationState.update(this.state.id, value, options);
  }

}

module.exports = StateManager;
