/**
 * @flow
 */

import { type AbstractComponent, type ComponentType } from "react";
import { type VariableDefinitionNode } from "graphql/language/ast";
import { capitalize } from "./helpers.js";

/** Configure visual fields (columns in a table, fields in a card) */
export type FieldConfig =
  | string
  | {|
      require: QueryFieldSpec,
      sortable?: boolean,
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
  sortable?: boolean,
  render?: AbstractComponent<{ value: any }>,
  width?: number,
};

export type QueryFieldSpec = {|
  field: string,
  require?: QueryFieldSpec[],
|};

export type FilterConfig =
  | string
  | {
      name: string,
      render?: AbstractComponent<{
        value: any,
        values?: Array<any>,
        onChange: (newValue: any) => void,
      }>,
    };

export type FilterSpec = {|
  render: ?ComponentType<{
    value: any,
    values?: Array<any>,
    onChange: (newValue: any) => void,
  }>,
|};

export type FilterSpecMap = Map<string, FilterSpec>;

export type FiltersConfig = FilterConfig[];

export type VariableDefinition = VariableDefinitionNode;

export function configureField(config: FieldConfig): FieldSpec {
  switch (typeof config) {
    case "string": {
      return {
        title: guessFieldTitle(config),
        require: {
          field: config,
          require: [],
        },
        // Allow sorting by default for string fields
        sortable: true,
      };
    }

    default: {
      return {
        title: config.title || guessFieldTitle(config.require.field),
        require: config.require,
        render: config.render,
        width: config.width,
        sortable: config.sortable,
      };
    }
  }
}

export function configureFields<T: { [name: string]: FieldConfig }>(
  configs: ?T,
): $ObjMap<T, <V>(V) => FieldSpec> {
  let specs = {};
  // eslint-disable-next-line no-unused-vars
  for (let name in configs) {
    specs[name] = configureField(configs[name]);
  }
  return specs;
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

export const configureFilters = (configs?: ?FiltersConfig): ?FilterSpecMap => {
  if (configs == null || configs.length === 0) {
    return null;
  }
  let SpecMap: FilterSpecMap = new Map();

  // eslint-disable-next-line no-unused-vars
  for (let config of configs) {
    if (typeof config === "string") {
      SpecMap.set(config, { render: null });
    } else if (typeof config === "object") {
      SpecMap.set(config.name, { render: config.render });
    }
  }

  return SpecMap;
};

export const FILTER_NO_VALUE = "undefined";
export const SORTING_VAR_NAME = "sort";
