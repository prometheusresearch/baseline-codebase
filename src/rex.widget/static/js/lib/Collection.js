/**
 * @copyright 2014, Prometheus Research LLC
 */
'use strict';

class Collection {

  constructor(ref, entity, updating) {
    this.ref = ref;
    this.entity = entity;
    this.data = entity[entity.entity].map(x => x.resolve());
    this.hasMore = this.entity.hasMore;
    this.updating = updating;
  }
}

module.exports = Collection;
