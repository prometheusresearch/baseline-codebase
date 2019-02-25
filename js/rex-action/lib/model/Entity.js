/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';
import type {Entity} from './types';

const STATE_ATTR_PREFIX = 'meta:state:'; /**
 * Create a new entity object by type.
 *
 *    let individual = createEntity('individual', 'I0331DSS', {...})
 */
export function createEntity(
  type: string,
  id: number | string,
  props?: ?Object,
  state?: Object,
): Entity {
  invariant(id != null, 'id cannot be null or undefined');
  let entity = {
    'meta:type': type,
    id: String(id),
    ...props,
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
export function isEntity(obj: any) {
  return obj && obj['meta:type'] && obj.id;
}

export function getEntityState(entity: Entity): Object {
  invariant(isEntity(entity), 'Expected an entity, got %s', entity);
  let state = {};
  for (let key in entity) {
    if (
      entity.hasOwnProperty(key) && key.indexOf(STATE_ATTR_PREFIX) === 0 && entity[key]
    ) {
      state[key.substring(STATE_ATTR_PREFIX.length)] = true;
    }
  }
  return state;
}

export function getEntityType(entity: Entity): string {
  invariant(isEntity(entity), 'Expected an entity, got %s', entity);
  return entity['meta:type'];
}

export function getEntityTitle(entity: Entity): ?string {
  invariant(isEntity(entity), 'Expected an entity, got %s', entity);
  return entity['meta:title'] || entity.__title__ || entity.title || null;
}
