/**
 * Bindings to HTSQL query HTTP API.
 *
 * @copyright 2015, Prometheus Research LLC
 */

import {fetch} from './fetch';

export default class Query {

  constructor(path) {
    this.path = path;
  }

  produce(params) {
    return fetch(this.path, params);
  }

  produceCollection(params) {
    return this.produce(params)
  }

  produceEntity(params) {
    return this.produce(params)
  }
}
