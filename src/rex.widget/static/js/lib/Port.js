/**
 * Low-level bindings to Rex Port.
 *
 * @copyright 2015, Prometheus Research LLC
 */

import {fetch, post}  from './fetch';
import invariant      from './invariant';

/**
 * An object which represent a port.
 *
 * All communication with a port goes through XHR using ES6 Promise based
 * interface.
 */
export default class Port {

  constructor(path) {
    this.path = path;
  }

  /**
   * Produce dataset from a port.
   */
  produce(params, options = {}) {
    let query = {
      ...params,
      ':FORMAT': options.format || Port.formats.json
    };
    return fetch(this.path, query);
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
  replace(prevEntity, entity, params, options = {}) {
    let query = {
      ...params,
      ':FORMAT': options.format || Port.formats.json
    };
    let data = new FormData();
    data.append('old', JSON.stringify(prevEntity));
    data.append('new', JSON.stringify(entity));
    return post(this.path, query, data);
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
    return this.replace(entity, null, params, options);
  }

  /**
   * Update an entity through a port.
   *
   * This is a shortcut for `replace({id: entity.id}, entity)`.
   */
  update(entity, params, options) {
    return this.replace({id: entity.id}, entity, params, options);
  }

  static formats = {
    json: 'application/json',
    html: 'text/html',
    raw: 'x-htsql/raw',
    csv: 'x-htsql/csv'
  };
}
