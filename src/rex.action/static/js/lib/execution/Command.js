/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import invariant from 'invariant';
import * as E from '../Entity';
import notImplemented from '../notImplemented';
import * as StringUtils from '../StringUtils';
import {type Context} from './State';
import {type Entity} from '../types';

export function command(...argumentTypes: ArgumentType[]): Function {
  return function command__decorate(target, key, desc) {
    return {
      ...desc,
      value: new Command(desc.value, key, argumentTypes),
    };
  };
}

export function getCommand(
  actionElement: React$Element<*>,
  commandName: string,
): ?Command {
  invariant(React.isValidElement(actionElement), 'Expected a valid React element');
  if (commandName === onContextCommand.name) {
    return onContextCommand;
  }
  return actionElement.type.commands ? actionElement.type.commands[commandName] : null;
}

export class Command {
  _execute: Function;
  name: string;
  argumentTypes: Array<ArgumentType>;

  constructor(execute: Function, name: string, argumentTypes: Array<ArgumentType>) {
    this._execute = execute;
    this.name = name;
    this.argumentTypes = argumentTypes;
  }

  execute(props: Object, context: Object, ...args: any[]): Context {
    const parsedArgs = args.map((arg, idx) => this.argumentTypes[idx].parse(props, arg));
    return this._execute(props, context, ...parsedArgs);
  }
}

class ArgumentType {
  @notImplemented parse(_actionElement, _value) {
    /* istanbul ignore next */
  }

  @notImplemented stringify(_actionElement, _value) {
    /* istanbul ignore next */
  }

  @notImplemented check(_actionElement, _value) {
    /* istanbul ignore next */
  }
}

class ValueType extends ArgumentType {
  stringify(_props: Object, value: any) {
    if (value == null) {
      return '~';
    } else {
      return String(value);
    }
  }

  parse(_props: Object, value: string) {
    if (value === '~') {
      return null;
    } else {
      return value;
    }
  }
}

class EntityType extends ArgumentType {
  stringify(props: Object, entity: Entity) {
    if (entity == null) {
      return '';
    }
    invariant(E.isEntity(entity), 'Expected an entity, got: %s', entity);
    let type = E.getEntityType(entity);
    let value = type + ':' + entity.id;
    let state = E.getEntityState(entity);
    let stateKeys = Object.keys(state);
    if (stateKeys.length > 0) {
      value = value + '!' + stateKeys.join(',');
    }
    return value;
  }

  parse(props: Object, value: string) {
    if (typeof value !== 'string') {
      return value;
    }
    if (value === '') {
      return null;
    }
    let [type, value2] = value.split(':');
    if (value2.indexOf('!') > -1) {
      let [id, stateKeys] = value2.split('!');
      let state = {};
      stateKeys.split(',').forEach(key => state[key] = true);
      return E.createEntity(type, id, null, state);
    } else {
      return E.createEntity(type, value2);
    }
  }
}

class ConfigurableEntityType extends ArgumentType {
  propName: string;

  constructor(propName: string) {
    super();
    this.propName = propName;
  }

  stringify(props: Object, entity: Entity): string {
    if (entity == null) {
      return '';
    }
    invariant(E.isEntity(entity), 'Expected an entity, got: %s', entity);
    let value = entity.id;
    let state = E.getEntityState(entity);
    let stateKeys = Object.keys(state);
    if (stateKeys.length > 0) {
      value = value + '!' + stateKeys.join(',');
    }
    return value;
  }

  parse(props: Object, value: string): ?Entity {
    if (typeof value !== 'string') {
      return value;
    }
    if (value === '') {
      return null;
    }
    let type = props[this.propName];
    invariant(type, 'Action should have prop "%s" defined', this.propName);
    if (value.indexOf('!') > -1) {
      let [id, stateKeys] = value.split('!');
      let state = {};
      stateKeys.split(',').forEach(key => state[key] = true);
      return E.createEntity(type.type.name, id, null, state);
    } else {
      return E.createEntity(type.type.name, value);
    }
  }
}

export class ObjectArgument extends ArgumentType {
  stringify(props: Object, object: Object): string {
    let value = [];
    for (let k in object) {
      if (object.hasOwnProperty(k)) {
        let v = object[k];
        if (v == null) {
          continue;
        }
        if (E.isEntity(v)) {
          v = '~' + entityType.stringify(props, v);
        }
        value.push(StringUtils.joinWithEquals([k, v]));
      }
    }
    return StringUtils.joinWithComma(value);
  }

  parse(props: Object, value: string): Object {
    if (typeof value !== 'string') {
      return value;
    }
    let object = {};
    let kv = StringUtils.splitByComma(value);
    for (let i = 0; i < kv.length; i++) {
      let [k, v] = StringUtils.splitByEquals(kv[i]);
      if (v[0] === '~') {
        v = entityType.parse(props, v.substring(1));
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
  [new ObjectArgument()],
);

export let Types = {
  Value() {
    return valueType;
  },

  Entity() {
    return entityType;
  },

  ConfigurableEntity(propName: string = 'entity') {
    return new ConfigurableEntityType(propName);
  },
};
