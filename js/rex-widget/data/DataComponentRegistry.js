/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';

type Component = {
  refresh: (force?: boolean) => void
}

const REGISTRY: Component[] = [];

export function registerDataComponent(component: Component) {
  REGISTRY.push(component);
}

export function unregisterDataComponent(component: Component) {
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

