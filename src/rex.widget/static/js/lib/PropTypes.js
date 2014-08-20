/**
 * @jsx React.DOM
 */
'use strict';

function requiredProp(props, name, component) {
  if (props[name] === undefined) {
    return new Error(`Property "${name}" is required for component "${component}"`);
  }
}

function makePropValidator(validator) {
  var instance = function(props, name, component) {
    if (props[name] !== undefined) {
      return validator(props[name], props, name, component);
    }
  }
  instance.isRequired = requiredProp;
  return instance;
}

var Data = makePropValidator(function(value, props, name, component) {
  if (value.data !== undefined) {
    return new Error(`Invalid Value object passed as prop "${name}" to component "${component}"`);
  }
});

module.exports = {Data};
