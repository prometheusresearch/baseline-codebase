/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {fetch} from '../fetch';
import shallowEquals from '../shallowEquals';

export class Query {

  static fetch = fetch;

  constructor(path, params) {
    this.path = path;
    this._params = params;
  }

  params(params) {
    return new this.constructor(this.path, {...this._params, ...params});
  }

  produce() {
    return this.constructor.fetch(this.path, this._params);
  }

  equals(other) {
    return (
      this.constructor === other.constructor &&
      this.path === other.path &&
      shallowEquals(this._params, other._params)
    );
  }
}

export default function query(path, params = {}) {
  return new Query(path, params);
}
