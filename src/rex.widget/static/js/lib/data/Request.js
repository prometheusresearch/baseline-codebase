/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {fetch} from '../fetch';
import shallowEquals from '../shallowEquals';

export class Request {

  static fetch = fetch;

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

  equals(other) {
    return (
      other &&
      this.constructor === other.constructor &&
      this.path === other.path &&
      shallowEquals(this._params, other._params)
    );
  }
}

export function isRequest(obj) {
  return obj instanceof Request;
}

export default function request(path, params = {}) {
  return new Request(path, params);
}
