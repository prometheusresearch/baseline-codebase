/**
 * @copyright 2015, Prometheus Research, LLC
 */

import notImplemented from './notImplemented';

export class Type {

  @notImplemented
  match() {}

  format() {
    return '<unknown type>';
  }
}

class AnyType extends Type {

  match(value, domain) { // eslint-disable-line no-unused-vars
    return true;
  }

  format() {
    return '<any>';
  }
}

export let anytype = new AnyType();

export class ValueType extends Type {

  constructor(name) {
    super();
    this.name = name;
  }

  match() {
    return true;
  }

  format() {
    return this.name;
  }
}

function matchesState(name, entity, domain) {
  let type = entity['meta:type'];
  let key = 'meta:state:' + name;
  let isSyn = domain[type] != null && domain[type][name] != null;
  if (!isSyn) {
    return entity[key];
  } else {
    return domain[type][name].expression(entity);
  }
}

export class EntityType extends Type {

  constructor(name, state) {
    super();
    this.name = name;
    this.state = state;
  }

  match(value, domain) {
    if (value == null) {
      return false;
    }
    let type = value['meta:type'];
    return (
      typeof value === 'object' &&
      type === this.name && (
        !this.state || matchesState(this.state.name, value, domain)
      )
    );
  }

  format() {
    return this.state ?
      `${this.name}[${this.state.name}]` :
      this.name;
  }
}

export class RowType extends Type {

  constructor(name, type) {
    super();
    this.name = name;
    this.type = type;
  }

  match(value, domain) {
    return this.type.match(value, domain);
  }
}


export class RecordType extends Type {

  constructor(rows, open = true) {
    super();
    this.rows = rows;
    this.open = open;
  }

  match(value, domain) {
    if (!value) {
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
