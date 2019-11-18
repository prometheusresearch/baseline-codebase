/**
 * @flow
 */

import { type AbstractComponent } from "react";
import { capitalize } from "./helpers.js";

/** Configure visual fields (columns in a table, fields in a card) */
export type FieldConfig =
  | string
  | {|
      require: QueryFieldSpec,
      title?: string,
      render?: AbstractComponent<{ value: any }>,
      width?: number,
    |};

export type FieldSpec = {
  /**
   * TODO: Maybe change to prevent things like:
   * "specName.require.require" -> "specName.subfields.require"
   */
  title: string,
  require: QueryFieldSpec,
  render?: AbstractComponent<{ value: any }>,
  width?: number,
};

export type QueryFieldSpec = {
  field: string,
  require?: QueryFieldSpec[],
};

export function configureField(config: FieldConfig): FieldSpec {
  switch (typeof config) {
    case "string": {
      return {
        title: guessFieldTitle(config),
        require: {
          field: config,
          require: [],
        },
      };
    }

    default: {
      return {
        title: config.title || guessFieldTitle(config.require.field),
        require: config.require,
        render: config.render,
        width: config.width,
      };
    }
  }
}

export function configureFields(configs: ?(FieldConfig[])): ?(FieldSpec[]) {
  if (configs == null) {
    return null;
  }
  return configs.map(configureField);
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

export const FILTER_NO_VALUE = "undefined";
