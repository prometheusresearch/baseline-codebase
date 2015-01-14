/**
 * @copyright 2014, Prometheus Research LLC
 */
'use strict';

class Entity {

  constructor(ref, entity, updating) {
    this.ref = ref;
    this.entity = entity;
    this.data = entity;
    this.updating = updating;
  }
}

module.exports = Entity;
