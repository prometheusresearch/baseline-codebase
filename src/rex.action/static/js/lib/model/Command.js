/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import type {Entity, Context} from './types';

import React from 'react';
import invariant from 'invariant';
import notImplemented from '../notImplemented';
import * as StringUtils from '../StringUtils';
import * as E from './Entity';

export function command(...argumentTypes: ArgumentType[]): Function {
  return function command__decorate(value) {
    return new Command(value, "default", argumentTypes);
  };
}

export function defineCommand(
  ActionComponent: Class<*>,
  spec: {
    name?: string,
    argumentTypes: ArgumentType[],
    execute: Function,
  },
): void {
  const {name = 'default', argumentTypes, execute} = spec;
  ActionComponent.commands = ActionComponent.commands || {};
  ActionComponent.commands[name] = new Command(execute, name, argumentTypes);
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

  parseArguments(props: Object, args: any[]): any[] {
    return args.map((arg, idx) => this.argumentTypes[idx].parse(props, arg));
  }

  execute(props: Object, context: Object, args: any[]): Context {
    return this._execute(props, context, ...args);
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
  stringify(props: Object, entity: ?Entity) {
    if (entity == null) {
      return '';
    }
    invariant(E.isEntity(entity), 'Expected an entity, got: %s', entity);
    let type = E.getEntityType(entity);
    let value = type + ':' + entity.id;
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
    return E.createEntity(type, value2);
  }
}

class ConfigurableEntityType extends ArgumentType {
  propName: string;

  constructor(propName: string) {
    super();
    this.propName = propName;
  }

  stringify(props: Object, entity: ?Entity): string {
    if (entity == null) {
      return '';
    }
    invariant(E.isEntity(entity), 'Expected an entity, got: %s', entity);
    let value = entity.id;
    return String(value);
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
    return E.createEntity(type.type.name, value);
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
