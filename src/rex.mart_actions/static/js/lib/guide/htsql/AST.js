/**
 * @copyright 2015, Prometheus Research, LLC
 */

function unparse(obj) {
  return obj && typeof obj.unparse === 'function' ? obj.unparse() : obj;
}

export class Node {
  unparse() {
    throw new Error('not implemented');
  }

  toQueryString() {
    return '/' + this.unparse();
  }

  static is(obj) {
    return obj instanceof this;
  }
}

export class Aggregation extends Node {
  constructor(name, args, refine) {
    super();
    this.type = 'Aggregation';
    this.name = name;
    this.args = args;
    this.refine = refine;
  }

  unparse() {
    return `${unparse(this.name)}(${this.args.filter(arg => arg !== undefined).map(unparse)})${this.refine.map(unparse).join('')}`;
  }
}

export class Collection extends Node {
  constructor(name, refine) {
    super();
    this.type = 'Collection';
    this.name = name;
    this.refine = refine;
  }

  count() {
    let refine = this.refine.filter(r => !(r instanceof Projection));
    return new Aggregation('count', [new Collection(this.name, refine)], []);
  }

  limit(top, skip) {
    let refine = this.refine.concat(new MethodCall('limit', [top, skip]));
    return new this.constructor(this.name, refine);
  }

  sort(column, asc) {
    let sort = `${column}${asc ? '' : '-'}`;
    let refine = this.refine.concat(new MethodCall('sort', [sort]));
    return new this.constructor(this.name, refine);
  }

  format(format) {
    return new Format(this, format);
  }

  unparse() {
    return `${unparse(this.name)}${this.refine.map(unparse).join('')}`;
  }
}

export class MethodCall extends Node {
  constructor(name, args) {
    super();
    this.type = 'MethodCall';
    this.name = name;
    this.args = args;
  }

  unparse() {
    return `.${unparse(this.name)}(${this.args})`;
  }
}

export class Projection extends Node {
  constructor(fields) {
    super();
    this.type = 'Projection';
    this.fields = fields;
  }

  unparse() {
    let fields = this.fields.map(unparse).join(', ');
    return `{${fields}}`;
  }
}

export class Record extends Node {
  constructor(name, projection) {
    super();
    this.type = 'Record';
    this.name = name;
    this.projection = projection;
  }

  unparse() {
    return `${unparse(this.name)} ${unparse(this.projection.unparse)}`;
  }
}

export class Field extends Node {
  constructor(field) {
    super();
    this.type = 'Field';
    this.field = field;
  }

  unparse() {
    return this.field;
  }
}

export class Alias extends Node {
  constructor(field, alias) {
    super();
    this.type = 'Alias';
    this.field = field;
    this.alias = alias;
  }

  unparse() {
    return `${unparse(this.field)} :as ${this.alias}`;
  }
}

export class Format extends Node {
  constructor(collection, format) {
    super();
    this.type = 'Format';
    this.collection = collection;
    this.format = format;
  }

  unparse() {
    return `${unparse(this.collection)}/:${this.format}`;
  }
}

