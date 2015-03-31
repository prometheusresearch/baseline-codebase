/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var clone           = require('clone');
var ObjectPath      = require('object-path');
var createValidator = require('is-my-json-valid');
var makeKeyPath     = require('./makeKeyPath');

/**
 * Thin wrapper over form value with associated validation information and flag
 * to force rendering validation errors.
 */
class Value {

  constructor(keyPath, rootSchema, root, onChange, allErrors, params) {
    this.rootSchema = rootSchema;
    this.schema = subSchemaByKeyPath(rootSchema, keyPath);
    this.root = root;
    this.value = ObjectPath.get(root, keyPath);
    this.onChange = onChange;
    this.allErrors = allErrors;
    this.params = params;
    this.keyPath = keyPath;
  }

  get parent() {
    if (this.keyPath.length === 0) {
      return null;
    }
    var keyPath = this.keyPath.slice();
    keyPath.pop();
    return new Value(
      keyPath,
      this.rootSchema,
      this.root,
      this.onChange,
      this.allErrors,
      this.params
    );
  }

  get errors() {
    if (!this.allErrors) {
      return null;
    }
    var exactKeyPath = `data.${this.keyPath.join('.')}`;
    var wildcardKeyPath = `data.${makeWildcardFromKeyPath(this.keyPath).join('.')}`;
    return this.allErrors.filter(error =>
      error.field === exactKeyPath || error.field === wildcardKeyPath);
  }

  select(key) {
    var keyPath = this.keyPath.concat(makeKeyPath(key));
    return new Value(
      keyPath,
      this.rootSchema,
      this.root,
      this.onChange,
      this.allErrors,
      this.params
    );
  }

  set(value, quiet) {
    var root = clone(this.root);
    if (this.keyPath.length === 0) {
      root = value;
    } else {
      ObjectPath.set(root, this.keyPath, value);
    }
    var nextValue = wrapValue(this.rootSchema, root, this.onChange, this.params);
    if (!quiet) {
      this.onChange(nextValue);
    }
    return nextValue;
  }

  setParams(params) {
    if (this.keyPath.length !== 0) {
      throw new Error('withParams() is only allowed on root value');
    }
    return new Value(
      this.keyPath,
      this.rootSchema,
      this.root,
      this.onChange,
      this.allErrors,
      {...this.params, ...params}
    );
  }
}

function makeWildcardFromKeyPath(keyPath) {
  var wildcard = [];
  for (var i = 0, len = keyPath.length; i < len; i++) {
    var item = keyPath[i];
    if (!isNaN(item)) {
      wildcard.push('*');
    } else {
      wildcard.push(item);
    }
  }
  return wildcard;
}

function subSchemaByKeyPath(schema, keyPath) {
  for (var i = 0, len = keyPath.length; i < len; i++) {
    if (!schema) {
      return;
    }
    schema = subSchemaByKey(schema, keyPath[i]);
  }
  return schema;
}

function subSchemaByKey(schema, key) {
  if (schema) {
    if (schema.type === 'object') {
      var subSchema = schema.properties ?
        schema.properties[key] :
        undefined;
      if (subSchema && Array.isArray(schema.required)) {
        // transfer required info onto schema
        subSchema = {
          ...subSchema,
          isRequired: schema.required.indexOf(key) !== -1
        };
      }
      return subSchema;
    } else if (schema.type === 'array' && schema.items) {
      if (Array.isArray(schema.items)) {
        return schema.items[key];
      } else {
        return schema.items;
      }
    } else {
      throw new Error(`${JSON.stringify(schema)} ${key}`);
    }
  }
}

var NON_ENUMERABLE_PROP = {
  enumerable: false,
  writable: true,
  configurable: true
};

function cache(obj, key, value) {
  Object.defineProperty(obj, key, {...NON_ENUMERABLE_PROP, value});
}

function validate(schema, value) {
  if (!schema) {
    return null;
  }
  if (value.__schema === schema && value.__errors) {
    return value.__errors;
  } else {
    if (schema.__validator === undefined) {
      cache(schema, '__validator', createValidator(schema, {greedy: true, formats: schema.formats}));
    }
    schema.__validator(value);
    var errors = schema.__validator.errors;
    cache(value, '__schema', schema);
    cache(value, '__errors', errors);
    return errors;
  }
}

function wrapValue(schema, value, onChange, params) {
  var allErrors = validate(schema, value);
  params = params || {};
  return new Value([], schema, value, onChange, allErrors, params);
}

function isValue(maybeValue) {
  return maybeValue instanceof Value;
}

module.exports = wrapValue;
module.exports.isValue = isValue;
module.exports.validate = validate;
