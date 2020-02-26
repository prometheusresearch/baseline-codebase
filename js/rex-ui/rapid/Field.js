/**
 * @flow
 */

import { type AbstractComponent, type ComponentType } from "react";
import { capitalize } from "./helpers.js";

/**
 * This configures how we render fields in pick/show screens.
 */
export type FieldConfig<+T = string> =
  /** Render field in default configuration. */
  | T
  /** Specify field rendering configuration. */
  | {|
      +name: T,
      +title?: string,
      +sortable?: boolean,
      +render?: AbstractComponent<{ value: any }>,
      +width?: number,
    |};

export opaque type FieldSpec: {
  name: string,
  title: string,
  sortable: boolean,
  render: ?AbstractComponent<{ value: any }>,
  width: ?number,
} = {|
  name: string,
  title: string,
  sortable: boolean,
  render: ?AbstractComponent<{ value: any }>,
  width: ?number,
|};

export function configureField(config: FieldConfig<>): FieldSpec {
  switch (typeof config) {
    case "string": {
      return {
        name: config,
        title: guessFieldTitle(config),
        sortable: true,
        render: null,
        width: null,
      };
    }

    default: {
      return {
        name: config.name,
        title: config.title || guessFieldTitle(config.name),
        render: config.render,
        width: config.width,
        sortable: config.sortable || false,
      };
    }
  }
}

export function configureFields(
  configs: Array<FieldConfig<>>,
): Array<FieldSpec> {
  return configs.map(c => configureField(c));
}

export function guessFieldTitle(field: string) {
  switch (field) {
    case "id":
      return "ID";
    case "":
      return "Column";
    default:
      return field
        .split("_")
        .map(capitalize)
        .join(" ");
  }
}
