/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import {fetch} from '../fetch';
import shallowEquals from '../shallowEquals';

const SORT_ASC = 'asc';
const SORT_DESC = 'desc';

const TOP_PARAM = '*:top';
const SKIP_PARAM = '*:skip';

function sortParam(valueKey) {
  if (Array.isArray(valueKey)) {
    valueKey = valueKey.join('.');
  }
  return `*.${valueKey}:sort`;
}

export class Port {

  static fetch = fetch;

  constructor(path, params = {}, expectSingleEntity = false) {
    this.path = path;
    this._params = params;
    this._expectSingleEntity = expectSingleEntity;
  }

  getSingleEntity() {
    return new this.constructor(this.path, this._params, true);
  }

  params(params) {
    return new this.constructor(this.path, {...this._params, ...params}, this._expectSingleEntity);
  }

  limit(top, skip = 0) {
    return this.params({[TOP_PARAM]: top, [SKIP_PARAM]: skip});
  }

  sort(valueKey, asc = true) {
    return this.params({[sortParam(valueKey)]: asc ? SORT_ASC : SORT_DESC});
  }

  produce() {
    return this.constructor.fetch(this.path, this._params).then(this._processData);
  }

  equals(other) {
    return (
      this.constructor === other.constructor &&
      this.path === other.path &&
      shallowEquals(this._params, other._params)
    );
  }

  @autobind
  _processData(result) {
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
  }
}

export default function port(path, params = {}) {
  return new Port(path, params);
}

