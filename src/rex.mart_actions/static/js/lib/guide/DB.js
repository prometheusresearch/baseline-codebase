/**
 * @copyright 2016, Prometheus Research, LLC
 */

import memoize from 'memoize-decorator';
import autobind from 'autobind-decorator';
import {fetch} from 'rex-widget/lib/fetch';
import resolveURL from 'rex-widget/lib/resolveURL';

class DB {

  constructor(query, mart) {
    this._query = query;
    this._mart = mart;
  }

  query(query) {
    return new this.constructor(query, this._mart);
  }

  count() {
    return this.query(this._query.count());
  }

  limit(top, skip) {
    return this.query(this._query.limit(top, skip));
  }

  sort(column, asc) {
    return this.query(this._query.sort(column, asc));
  }

  get href() {
    return resolveURL(`rex.mart:/mart/${this._mart}/${this._query.unparse()}`);
  }

  produce() {
    return fetch(this.href).then(this._extractData);
  }

  equals(other) {
    if (this.constructor !== other.constructor) {
      return false;
    }
    if (this._query.unparse() !== other._query.unparse()) {
      return false;
    }
    if (this._mart !== other._mart) {
      return false;
    }
    return true;
  }

  _extractData(data) {
    for (let key in data) {
      return data[key];
    }
  }
}

export default function db(query, mart) {
  return new DB(query, mart);
}

