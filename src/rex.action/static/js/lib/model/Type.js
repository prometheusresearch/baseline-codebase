/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import type {Domain, Entity} from './types';

export class Type {
  match(_value: mixed, _domain: Domain): boolean {
    throw new Error(`${this.constructor.name}.match(value, domain) is not implemented`);
  }

  format() {
    return '<unknown type>';
  }
}

class AnyType extends Type {
  match(_value: mixed, _domain: Domain): boolean {
    return true;
  }

  format() {
    return '<any>';
  }
}

export let anytype = new AnyType();

export class ValueType extends Type {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  match(_val: mixed, _domain: Domain) {
    return true;
  }

  format() {
    return this.name;
  }
}

function matchesState(name: string, entity: Entity, domain: Domain): boolean {
  let type = entity['meta:type'];
  let key = 'meta:state:' + name;
  let isSyn = domain[type] != null && domain[type][name] != null;
  if (!isSyn) {
    return Boolean(entity[key]);
  } else {
    return domain[type][name].expression(entity);
  }
}

export class EntityType extends Type {
  /**
   * Entity name.
   */
  name: string;

  /**
   * Entity state.
   *
   * Can be `null`, in that case it means there's no constaint on the entity state.
   */
  state: ?Object;

  constructor(name: string, state: ?Object) {
    super();
    this.name = name;
    this.state = state;
  }

  match(value: mixed, domain: Domain) {
    if (value == null || typeof value !== 'object') {
      return false;
    }
    if (value['meta:type'] !== this.name) {
      return false;
    }
    if (!this.state) {
      return true;
    }
    const entity: Entity = (value: any);
    return matchesState(this.state.name, entity, domain);
  }

  format() {
    return this.state ? `${this.name}[${this.state.name}]` : this.name;
  }
}

export class RowType extends Type {
  name: string;
  type: Type;

  constructor(name: string, type: Type) {
    super();
    this.name = name;
    this.type = type;
  }

  match(value: mixed, domain: Domain) {
    return this.type.match(value, domain);
  }
}

export class RecordType extends Type {
  rows: {[key: string]: RowType};
  open: boolean;
  constructor(rows: {[key: string]: RowType}, open?: boolean = true) {
    super();
    this.rows = rows;
    this.open = open;
  }

  match(value: mixed, domain: Domain) {
    if (!value) {
      return false;
    }
    if (typeof value !== 'object') {
      return false;
    }
    for (let key in this.rows) {
      if (this.rows.hasOwnProperty(key)) {
        if (value[key] == null) {
          return false;
        }
        if (!this.rows[key].match(value[key], domain)) {
          return false;
        }
      }
    }
    if (!this.open) {
      // TODO:
    }
    return true;
  }
}
