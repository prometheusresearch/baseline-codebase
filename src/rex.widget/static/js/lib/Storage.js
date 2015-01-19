/**
 * Entity storage for Rex Port.
 *
 * @copyright 2014, Prometheus Research LLC
 */
'use strict';

var Port        = require('./Port');
var mergeInto   = require('./mergeInto');
var invariant   = require('./invariant');
var ActionTypes = require('./runtime/ActionTypes');

/**
 * Port which caches entities in storage.
 */
class StorageAwarePort extends Port {

  constructor(path, storage) {
    super(path);
    this.storage = storage;
  }

  handleResponse(response) {
    var data = super(response);
    this.storage.add(data);
    return data;
  }

}

/**
 * Reference to an entity in storage.
 */
class Ref {

  constructor(storage, entity, id, path) {
    this.storage = storage;
    this.entity = entity;
    this.id = id;
    this.path = path || [];
  }

  toString() {
    return `Ref { "#/${this.entity}/${this.id}/${this.path.join('/')}" }`;
  }

  toJSON() {
    return {
      entity: this.entity,
      id: this.id,
      path: this.path
    };
  }

  resolve() {
    return this.storage.resolve(this);
  }

  equals(ref) {
    return (
      ref &&
      ref.storage === this.storage &&
      ref.entity === this.entity &&
      ref.id === this.id &&
      ref.path === this.path
    );
  }
}

/**
 * Denormalized entity store.
 */
class Storage {

  constructor(dispatcher) {
    dispatcher.register(this._onAction.bind(this));
    this._storageByType = {};
  }

  _onAction(action) {
    switch (action.type) {
      case ActionTypes.PAGE_INIT:
      case ActionTypes.PAGE_UPDATE_COMPLETE:
        var {data} = action.payload;
        this.add(data);
        break;
    }
  }

  createPort(path) {
    return new StorageAwarePort(path, this);
  }

  createRef(pointer) {
    if (pointer[0] === '#') {
      pointer = pointer.slice(1);
    }
    pointer = pointer.split('/').filter(Boolean);
    var [entity, id, ...path] = pointer;
    return new Ref(this, entity, id, path);
  }

  resolve(ref) {
    if (!(ref instanceof Ref)) {
      ref = this.createRef(ref);
    }

    var cur;

    var storage = this._storageByType[ref.entity];
    if (storage !== undefined) {
      cur = storage[ref.id];
    }

    for (var i = 0, len = ref.path.length; i < len; i++) {
      cur = cur[ref.path[i]];
      if (cur instanceof Ref) {
        cur = cur.resolve();
      } else if (Array.isArray(cur) && cur[0] instanceof Ref) {
        cur = cur.map(r => r.resolve());
      }
    }
    return cur;
  }

  add(data) {
    for (var type in data) {
      if (data.hasOwnProperty(type)) {
        this._add(type, data[type]);
      }
    }
  }

  _add(type, items) {
    if (!Array.isArray(items)) {
      items = [items];
    }

    if (this._storageByType[type] === undefined) {
      this._storageByType[type] = {};
    }
    var storage = this._storageByType[type];

    for (var i = 0, len = items.length; i < len; i++) {
      var item = items[i];
      if (item === null) {
        continue;
      }
      var entity = {};
      for (var key in item) {
        if (item.hasOwnProperty(key)) {
          var attribute = item[key];
          // One-to-one relation
          if (attribute instanceof Object && attribute.id !== undefined) {
            this._add(key, attribute);
            entity[key] = new Ref(this, key, attribute.id);
          // One-to-many relation
          } else if (
            Array.isArray(attribute) &&
            attribute.length > 0 &&
            attribute[0].id !== undefined
          ) {
            entity[key] = attribute.map(attr => {
              this._add(key, attr);
              return new Ref(this, key, attr.id);
            });
          // One-to-many relation (append)
          } else if (
            attribute &&
            attribute.__append__ &&
            Array.isArray(attribute.__append__)
          ) {
            entity[key] = {
              __append__: attribute.__append__.map(attr => {
                this._add(key, attr);
                return new Ref(this, key, attr.id);
              })
            };
          // Regular attribute
          } else {
            entity[key] = attribute;
          }
        }
      }

      if (storage[item.id] === undefined) {
        storage[item.id] = entity;
      } else {
        storage[item.id] = mergeEntity(storage[item.id], entity);
      }
    }
  }

}

function mergeEntity(prev, update) {
  var result = {};
  mergeInto(result, prev);
  for (var key in update) {
    if (!update.hasOwnProperty(key)) {
      continue;
    }
    if (update[key] && update[key].__append__) {
      if (result[key] === undefined) {
        result[key] = update[key].__append__;
      } else if (Array.isArray(result[key])) {
        result[key] = result[key].concat(update[key].__append__);
      } else {
        invariant(false, 'trying to append to a non-array entity attribute');
      }
    } else {
      result[key] = update[key];
    }
  }
  return result;
}

module.exports = Storage;
module.exports.Ref = Ref;
module.exports.StorageAwarePort = StorageAwarePort;
