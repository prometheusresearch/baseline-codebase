/**
 * @copyright 2015, Prometheus Research, LLC
 */

export class Type {

  match() {
    throw new Error('not implemented');
  }
}

class AnyType extends Type {

  match(value) {
    return true;
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
}

export class EntityType extends Type {

  constructor(name, state) {
    super();
    this.name = name;
    this.state = state;
  }

  match(value) {
    return (
      typeof value === 'object' &&
      value['meta:type'] === this.name && (
        this.state && value[`meta:state:${this.state.name}`] ||
        !this.state
      )
    );
  }
}

export class RowType extends Type {

  constructor(name, type) {
    super();
    this.name = name;
    this.type = type;
  }

  match(value) {
    return this.type.match(value);
  }
}


export class RecordType extends Type {

  constructor(rows, open = true) {
    super();
    this.rows = rows;
    this.open = open;
  }

  match(value) {
    for (let key in this.rows) {
      if (this.rows.hasOwnProperty(key)) {
        if (value[key] == null) {
          return false;
        }
        if (!this.rows[key].match(value[key])) {
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
