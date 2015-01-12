/**
 * @copyright 2014, Prometheus Research LLC
 */
'use strict';

class Collection {

  constructor(ref, entity) {
    this.ref = ref;
    this.entity = entity;
    this.data = entity[entity.entity].map(x => x.resolve());
  }
}

module.exports = Collection;
