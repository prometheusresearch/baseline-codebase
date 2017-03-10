/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React            from 'react';
import invariant        from 'invariant';
import * as Entity      from '../Entity';
import notImplemented   from '../notImplemented';
import * as StringUtils from '../StringUtils';

export function command(...argumentTypes) {
  return function command__decorate(target, key, desc) {
    return {
      ...desc,
      value: new Command(desc.value, key, argumentTypes)
    };
  };
}

export function getCommand(actionElement, commandName) {
  invariant(
    React.isValidElement(actionElement),
    'Expected a valid React element'
  );
  if (commandName === onContextCommand.name) {
    return onContextCommand;
  }
  return actionElement.type.commands ?
    actionElement.type.commands[commandName] :
    null;
}


export class Command {

  constructor(execute, name, argumentTypes) {
    this._execute = execute;
    this.name = name;
    this.argumentTypes = argumentTypes;
  }

  execute(...args) {
    return this._execute(...args);
  }

}

class ArgumentType {

  @notImplemented
  parse(_actionElement, _value) {
    /* istanbul ignore next */
  }

  @notImplemented
  stringify(_actionElement, _value) {
    /* istanbul ignore next */
  }

  @notImplemented
  check(_actionElement, _value) {
    /* istanbul ignore next */
  }
}

class ValueType extends ArgumentType {

  stringify(actionElement, value) {
    if (value == null) {
      return '~';
    } else {
      return String(value);
    }
  }

  parse(actionElement, value) {
    if (value === '~') {
      return null;
    } else {
      return value;
    }
  }

}

class EntityType extends ArgumentType {

  stringify(actionElement, entity) {
    if (entity == null) {
      return '';
    }
    invariant(
      Entity.isEntity(entity),
      'Expected an entity, got: %s', entity
    );
    let type = Entity.getEntityType(entity);
    let value = type + ':' + entity.id;
    let state = Entity.getEntityState(entity);
    let stateKeys = Object.keys(state);
    if (stateKeys.length > 0) {
      value = value + '!' + stateKeys.join(',');
    }
    return value;
  }

  parse(actionElement, value) {
    if (value === '') {
      return null;
    }
    let [type, value2] = value.split(':');
    if (value2.indexOf('!') > -1) {
      let [id, stateKeys] = value2.split('!');
      let state = {};
      stateKeys.split(',').forEach(key => state[key] = true);
      return Entity.createEntity(type, id, null, state);
    } else {
      return Entity.createEntity(type, value2);
    }
  }
}

class ConfigurableEntityType extends ArgumentType {

  constructor(propName) {
    super();
    this.propName = propName;
  }

  stringify(actionElement, entity) {
    if (entity == null) {
      return '';
    }
    invariant(
      Entity.isEntity(entity),
      'Expected an entity, got: %s', entity
    );
    let value = entity.id;
    let state = Entity.getEntityState(entity);
    let stateKeys = Object.keys(state);
    if (stateKeys.length > 0) {
      value = value + '!' + stateKeys.join(',');
    }
    return value;
  }

  parse(actionElement, value) {
    if (value === '') {
      return null;
    }
    let type = actionElement.props[this.propName];
    invariant(
      type,
      'Action should have prop "%s" defined', this.propName
    );
    if (value.indexOf('!') > -1) {
      let [id, stateKeys] = value.split('!');
      let state = {};
      stateKeys.split(',').forEach(key => state[key] = true);
      return Entity.createEntity(type.type.name, id, null, state);
    } else {
      return Entity.createEntity(type.type.name, value);
    }
  }
}

export class ObjectArgument extends ArgumentType {

  stringify(actionElement, object) {
    let value = [];
    for (let k in object) {
      if (object.hasOwnProperty(k)) {
        let v = object[k];
        if (v == null) {
          continue;
        }
        if (Entity.isEntity(v)) {
          v = '~' + entityType.stringify(actionElement, v);
        }
        value.push(StringUtils.joinWithEquals([k, v]));
      }
    }
    return StringUtils.joinWithComma(value);
  }

  parse(actionElement, value) {
    let object = {};
    let kv = StringUtils.splitByComma(value);
    for (let i = 0; i < kv.length; i++) {
      let [k, v] = StringUtils.splitByEquals(kv[i]);
      if (v[0] === '~') {
        v = entityType.parse(actionElement, v.substring(1));
      }
      object[k] = v;
    }
    return object;
  }
}

let entityType = new EntityType();
let valueType = new ValueType();

export let onContextCommand = new Command(
  function(props, context, update) {
    return {...context, ...update};
  },
  'context',
  [new ObjectArgument()]
);


export let Types = {

  Value() {
    return valueType;
  },

  Entity() {
    return entityType;
  },

  ConfigurableEntity(propName = 'entity') {
    return new ConfigurableEntityType(propName);
  },

};

