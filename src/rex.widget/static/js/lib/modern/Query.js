/**
 * Bindings to HTSQL query HTTP API.
 *
 * @copyright 2015, Prometheus Research LLC
 */
'use strict';

var request   = require('../request');

class Query {

  constructor(path) {
    this.path = path;
  }

  produce(params) {
    return request('GET', this.path)
      .query(params)
      .set('Accept', 'application/json')
      .promise()
      .then(this._handleResponse);
  }

  produceCollection(params) {
    return this.produce()
  }

  produceEntity(params) {
    return this.produce()
  }
}

module.exports = Query;
