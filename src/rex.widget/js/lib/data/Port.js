/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {fetch, post} from '../fetch';
import {shallowParamsEquals as shallowEquals} from '../shallowEquals';
import {isArray} from '../lang';

const SORT_ASC = 'asc';
const SORT_DESC = 'desc';

const TOP_PARAM = '*:top';
const SKIP_PARAM = '*:skip';

function sortParam(valueKey) {
  if (isArray(valueKey)) {
    valueKey = valueKey.join('.');
  }
  return `*.${valueKey}:sort`;
}

export class Port {

  static fetch = fetch;

  static post = post;

  static formats = {
    json: 'application/json',
    html: 'text/html',
    raw: 'x-htsql/raw',
    csv: 'x-htsql/csv'
  };

  constructor(path, params = {}, expectSingleEntity = false) {
    this.path = path;
    this._params = params;
    this._expectSingleEntity = expectSingleEntity;
  }

  getSingleEntity() {
    return new this.constructor(this.path, this._params, true);
  }

  params(params) {
    return new this.constructor(
      this.path,
      {...this._params, ...params},
      this._expectSingleEntity);
  }

  limit(top, skip = 0) {
    return this.params({[TOP_PARAM]: top, [SKIP_PARAM]: skip});
  }

  sort(valueKey, asc = true) {
    return this.params({[sortParam(valueKey)]: asc ? SORT_ASC : SORT_DESC});
  }

  equals(other) {
    return (
      other &&
      this.constructor === other.constructor &&
      this.path === other.path &&
      shallowEquals(this._params, other._params)
    );
  }

  _processData = (result) => {
    for (let key in result) {
      let data = result[key];
      if (this._expectSingleEntity) {
        if (data.length > 1) {
          throw new Error('expected a single entity to be returned from port');
        }
        data = data[0] || null;
      }
      return data;
    }
  };

  /**
   * Send request to produce entities from port.
   */
  produce(params, options = {}) {
    let query = {
      ...this._params,
      ...params,
      ':FORMAT': options.format || this.constructor.formats.json
    };
    return this.constructor.fetch(this.path, query).then(this._processData);
  }

  /**
   * Send request to produce a collection from port.
   */
  produceCollection(params, options) {
    return this.produce(params, options);
  }

  /**
   * Send request to produce a single entity from port.
   */
  produceEntity(params, options) {
    return this.getSingleEntity().produce(params, options);
  }

  /**
   * Send a request to replace an entity.
   */
  replace(prevEntity, entity, params, options = {}) {
    let query = {
      ...this._params,
      ...params,
      ':FORMAT': options.format || this.constructor.formats.json
    };
    let data = new FormData();
    data.append('old', JSON.stringify(prevEntity));
    data.append('new', JSON.stringify(entity));
    return this.constructor.post(this.path, query, data);
  }

  /**
   * Insert an entity through a port.
   *
   * This is a shortcut for `replace(null, entity)`.
   */
  insert(entity, params, options) {
    return this.replace(null, entity, params, options);
  }

  /**
   * Delete an entity through a port.
   *
   * This is a shortcut for `replace({id: entity.id}, null)`.
   */
  delete(entity, params, options) {
    return this.replace(entity, null, params, options);
  }

  /**
   * Update an entity through a port.
   *
   * This is a shortcut for `replace({id: entity.id}, entity)`.
   */
  update(entity, params, options) {
    return this.replace({id: entity.id}, entity, params, options);
  }

  inspect() {
    return `${this.constructor.name} { path: ${this.path} }`;
  }
}

export function isPort(obj) {
  return obj instanceof Port;
}

export default function port(path, params = {}) {
  return new Port(path, params);
}

