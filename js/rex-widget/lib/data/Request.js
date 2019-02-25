/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import type {FetchData, FetchParams} from '../fetch';
import {fetch, post, type Headers} from '../fetch';
import {shallowParamsEquals as shallowEquals} from '../shallowEquals';

export class Request {
  path: string;
  _params: FetchParams;
  _data: ?FetchData;
  _transitionable: boolean;
  _headers: Headers;

  static fetch = fetch;
  static post = post;

  constructor(
    path: string,
    params: FetchParams,
    data: ?FetchData = null,
    transitionable: boolean = false,
    headers: Headers = {},
  ) {
    this.path = path;
    this._params = params;
    this._data = data;
    this._transitionable = transitionable;
    this._headers = headers;
  }

  asTransitionable() {
    return new this.constructor(this.path, this._params, this._data, true, this._headers);
  }

  addPath(path: string) {
    return new this.constructor(
      this.path + path,
      this._params,
      this._data,
      this._transitionable,
      this._headers,
    );
  }

  params(params: FetchParams) {
    return new this.constructor(
      this.path,
      {...this._params, ...params},
      this._data,
      this._transitionable,
      this._headers,
    );
  }

  data(data: FetchData) {
    return new this.constructor(
      this.path,
      this._params,
      data,
      this._transitionable,
      this._headers,
    );
  }

  headers(headers: Headers) {
    headers = {...this._headers, ...headers};
    return new this.constructor(
      this.path,
      this._params,
      this._data,
      this._transitionable,
      headers,
    );
  }

  produce(params: FetchParams) {
    let query = {
      ...this._params,
      ...params,
    };
    if (this._data !== null) {
      return this.constructor.post(this.path, query, this._data, {
        useTransit: this._transitionable,
        headers: this._headers,
      });
    } else {
      return this.constructor.fetch(this.path, query, {
        useTransit: this._transitionable,
        headers: this._headers,
      });
    }
  }

  equals(other: Request) {
    return (
      other &&
      this.constructor === other.constructor &&
      this._data === other._data &&
      this.path === other.path &&
      this._transitionable === other._transitionable &&
      shallowEquals(this._params, other._params) &&
      shallowEquals(this._headers, other._headers)
    );
  }
}

export function isRequest(obj: mixed) {
  return obj instanceof Request;
}

export default function request(
  path: string,
  params: FetchParams = {},
  data: ?FetchData = null,
) {
  return new Request(path, params, data);
}
