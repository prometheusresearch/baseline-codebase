/**
 * Bindings to HTSQL query HTTP API.
 *
 * @copyright 2015, Prometheus Research LLC
 */
'use strict';

var request   = require('./request');

class Query {

  constructor(path) {
    this.path = path;
  }

  handleResponse(response) {
    return JSON.parse(response.text);
  }

  produce(params) {
    return request('GET', this.path)
      .query(params)
      .set('Accept', 'application/json')
      .promise()
      .then(this.handleResponse);
  }

  produceCollection(params) {
    return this.produce(params)
  }

  produceEntity(params) {
    return this.produce(params)
  }
}

module.exports = Query;
