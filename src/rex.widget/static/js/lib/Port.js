/**
 * Low-level bindings to Rex Port.
 *
 * @copyright 2015, Prometheus Research LLC
 */
'use strict';

var request   = require('./request');
var invariant = require('./invariant');

/**
 * An object which represent a port.
 *
 * All communication with a port goes through XHR using ES6 Promise based
 * interface.
 */
class Port {

  constructor(path) {
    this.path = path;
    this.handleResponse = this.handleResponse.bind(this);
  }

  /**
   * Construct a request object with given parameters and options.
   *
   * Subclasses can override this method to provide custom configuration for
   * request object.
   */
  request(method, params, options) {
    var query = _prepareQuery(params, options);
    return request(method, this.path).query(query);
  }

  /**
   * Process HTTP response. The result will be used as a result
   * of a port method calls.
   *
   * Subclasses can override this method to provide custom processing for
   * response object.
   */
  handleResponse(response) {
    return JSON.parse(response.text);
  }

  /**
   * Produce dataset from a port.
   */
  produce(params, options) {
    return this.request('GET', params, options)
      .promise()
      .then(this.handleResponse);
  }

  produceCollection(params, options) {
    return this.produce(params, options)
      .then(result => {
        var keys = Object.keys(result);
        invariant(
          keys.length === 1,
          'Port.produceCollection() can only query ports which return a single dataset'
        );
        result = result[keys[0]];
        return result;
      });
  }

  produceEntity(params, options) {
    return this.produce(params, options)
      .then(result => {
        var keys = Object.keys(result);
        invariant(
          keys.length === 1,
          'Port.produceEntity() can only query ports which return a single dataset'
        );
        result = result[keys[0]];
        return result[0] || null;
      });
  }

  /**
   * Replace an entity through a port.
   */
  replace(prevEntity, entity, params, options) {
    return this.request('POST')
      .type('form')
      .send({'old': JSON.stringify(prevEntity)})
      .send({'new': JSON.stringify(entity)})
      .promise()
      .then(this.handleResponse);
  }

  /**
   * Insert an entity through a port.
   *
   * This is a shortcut for `replace(null, entity)`.
   */
  insert(entity, params, options) {
    return this.replace(null, entity, params, options);
  }

  /**
   * Delete an entity through a port.
   *
   * This is a shortcut for `replace({id: entity.id}, null)`.
   */
  delete(entity, params, options) {
    return this.replace({id: entity.id}, null, params, options);
  }

  /**
   * Update an entity through a port.
   *
   * This is a shortcut for `replace({id: entity.id}, entity)`.
   */
  update(entity, params, options) {
    return this.replace({id: entity.id}, entity, params, options);
  }
}

Port.FORMAT = {
  JSON: 'application/json',
  HTML: 'text/html',
  RAW: 'x-htsql/raw',
  CSV: 'x-htsql/csv'
};

/**
 * Prepare query from parameters and options.
 */
function _prepareQuery(params, options) {
  options = options || {};
  return {
    ...params,
    ':FORMAT': options.format || Port.FORMAT.JSON
  };
}

module.exports = Port;
