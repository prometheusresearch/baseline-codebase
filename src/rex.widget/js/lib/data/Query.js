/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {fetch, post} from '../fetch';
import {shallowParamsEquals as shallowEquals} from '../shallowEquals';

export class Query {

  static fetch = fetch;
  static post = post;

  constructor(path, params) {
    this.path = path;
    this._params = params;
  }

  params(params) {
    return new this.constructor(this.path, {...this._params, ...params});
  }

  produce(params) {
    let query = {
      ...this._params,
      ...params
    };
    return this.constructor.fetch(this.path, query);
  }

  execute(params) {
    let data = {
      ...this._params,
      ...params
    };
    return this.constructor.post(this.path, undefined, data);
  }

  produceCollection(params) {
    return this.produce(params);
  }

  produceEntity(params) {
    return this.produce(params);
  }

  equals(other) {
    return (
      other &&
      this.constructor === other.constructor &&
      this.path === other.path &&
      shallowEquals(this._params, other._params)
    );
  }
}

export function isQuery(obj) {
  return obj instanceof Query;
}

export default function query(path, params = {}) {
  return new Query(path, params);
}
