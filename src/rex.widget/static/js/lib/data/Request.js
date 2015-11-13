/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {fetch, post} from '../fetch';
import shallowEquals from '../shallowEquals';

export class Request {

  static fetch = fetch;
  static post = post;

  constructor(path, params, data = null) {
    this.path = path;
    this._params = params;
    this._data = data;
  }

  params(params) {
    return new this.constructor(this.path, {...this._params, ...params}, this._data);
  }

  data(data) {
    return new this.constructor(this.path, this._params, data);
  }

  produce(params) {
    let query = {
      ...this._params,
      ...params
    };
    if (this._data !== null) {
      return this.constructor.post(this.path, query, this._data);
    } else {
      return this.constructor.fetch(this.path, query);
    }
  }

  equals(other) {
    return (
      other &&
      this.constructor === other.constructor &&
      this._data === other._data &&
      this.path === other.path &&
      shallowEquals(this._params, other._params)
    );
  }
}

export function isRequest(obj) {
  return obj instanceof Request;
}

export default function request(path, params = {}, data = null) {
  return new Request(path, params, data);
}
