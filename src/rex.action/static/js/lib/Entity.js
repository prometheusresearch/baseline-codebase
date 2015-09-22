/**
 * @copyright 2015, Prometheus Research, LLC
 */

import invariant from 'invariant';

const TYPE_ATTR = 'meta:type';
const TITLE_ATTR = 'meta:title';
const ID_ATTR = 'id';

const STATE_ATTR_PREFIX = 'meta:state:';

/**
 * Create a new entity object by type.
 *
 *    let individual = createEntity('individual', 'I0331DSS', {...})
 */
export function createEntity(type, id, props, state) {
  let entity = {
    [TYPE_ATTR]: type,
    [ID_ATTR]: id,
    ...props
  };
  if (state) {
    for (let key in state) {
      if (state.hasOwnProperty(key) && state[key]) {
        entity[STATE_ATTR_PREFIX + key] = true;
      }
    }
  }
  return entity;
}
/**
 * Check if given object is an entity.
 */
export function isEntity(obj) {
  return obj && obj[TYPE_ATTR] && obj[ID_ATTR];
}

export function getEntityState(entity) {
  invariant(
    isEntity(entity),
    'Expected an entity, got %s', entity
  );
  let state = {};
  for (let key in entity) {
    if (
      entity.hasOwnProperty(key) &&
      key.indexOf(STATE_ATTR_PREFIX) === 0 &&
      entity[key]
    ) {
      state[key.substring(STATE_ATTR_PREFIX.length)] = true;
    }
  }
  return state;
}

export function getEntityType(entity) {
  invariant(
    isEntity(entity),
    'Expected an entity, got %s', entity
  );
  return entity[TYPE_ATTR];
}

export function getEntityTitle(entity) {
  invariant(
    isEntity(entity),
    'Expected an entity, got %s', entity
  );
  return entity[TITLE_ATTR] || entity.__title__ || entity.title || null;
}
