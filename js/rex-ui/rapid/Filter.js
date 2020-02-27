/**
 * This describes filter configuration.
 *
 * @flow
 */

import type { AbstractComponent } from "react";

export type FilterConfig<+T: string = string, V = any> =
  | T
  | {
      +name: T,
      +render?: ?RenderFilter<V>,
    };

export type FilterSpec = {|
  +name: string,
  +render: ?RenderFilter<any>,
|};

type RenderFilter<V> = AbstractComponent<{
  value: V,
  values?: Array<V>,
  onChange: (nextValue: V) => void,
}>;

export type FilterSpecMap = Map<string, FilterSpec>;

export const configureFilters = (
  configs: ?Array<FilterConfig<>>,
): ?FilterSpecMap => {
  if (configs == null || configs.length === 0) {
    return null;
  }
  let map: FilterSpecMap = new Map();

  configs.forEach(config => {
    if (typeof config === "string") {
      map.set(config, { name: config, render: null });
    } else if (typeof config === "object") {
      map.set(config.name, { name: config.name, render: config.render });
    }
  });

  return map;
};

export const NO_VALUE = "undefined";
export const SORT_FIELD = "sort";
