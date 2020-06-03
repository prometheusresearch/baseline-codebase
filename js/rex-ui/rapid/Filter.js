/**
 * This describes filter configuration.
 *
 * @flow
 */

import type { AbstractComponent } from "react";

export type FilterConfig<V> = {
  +name: string,
  +render: RenderFilter<V>,
};

export type FilterSpec = {|
  +name: string,
  +render: RenderFilter<any>,
|};

export type RenderFilterProps<V> = {|
  name: string,
  params: V,
  onParams: ((V) => V) => void,
|};

export type RenderFilter<V> = AbstractComponent<RenderFilterProps<V>>;

export type FilterSpecMap = Map<string, FilterSpec>;

export function configureFilters(
  configs: ?Array<FilterConfig<any>>,
): ?FilterSpecMap {
  if (configs == null || configs.length === 0) {
    return null;
  }
  let map: FilterSpecMap = new Map();

  configs.forEach(config => {
    let spec = configureFilter(config);
    if (spec != null) {
      map.set(spec.name, spec);
    }
  });

  return map;
}

export function configureFilter(config: ?FilterConfig<any>): ?FilterSpec {
  if (config == null) {
    return null;
  } else {
    return { name: config.name, render: config.render };
  }
}

export const NO_VALUE = "undefined";
export const SORT_FIELD = "sort";
