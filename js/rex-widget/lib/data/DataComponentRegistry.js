/**
 * @copyright 2015, Prometheus Research, LLC
 */

import invariant from 'invariant';

const REGISTRY = [];

export function registerDataComponent(component) {
  REGISTRY.push(component);
}

export function unregisterDataComponent(component) {
  let index = REGISTRY.indexOf(component);
  invariant(
    index > -1,
    'trying to unregister data component which was not previously registered'
  );
  REGISTRY.splice(index, 1);
}

export function forceRefresh() {
  REGISTRY.forEach(component => {
    component.refresh(true);
  });
}

