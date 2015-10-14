/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind   from 'autobind-decorator';
import {fetch}    from '../fetch';
import valueOf    from '../valueOf';

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

class Port {

  constructor(path, params) {
    this.path = path;
    this.params = params;
  }

  fetch(params) {
    return new this.constructor(this.path, {...this.params, ...params});
  }

  limit(top, skip) {
    return this.fetch({[TOP_PARAM]: top, [SKIP_PARAM]: skip});
  }

  sort(valueKey, asc = true) {
    return this.fetch({[sortParam(valueKey)]: asc ? SORT_ASC : SORT_DESC});
  }

  produce() {
    return fetch(this.path, this.params).then(this._extractData);
  }

  equals(other) {
    if (this.constructor !== other.constructor) {
      return false;
    }
    if (this.path !== other.path) {
      return false;
    }
    let keys = Object.keys(this.params);
    if (keys.length !== Object.keys(other.params).length) {
      return false;
    }
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (valueOf(this.params[key]) !== valueOf(other.params[key])) {
        return false;
      }
    }
    return true;
  }

  _extractData(data) {
    for (let key in data) {
      return data[key];
    }
  }
}

export default function port(path, params = {}) {
  return new Port(path, params);
}

