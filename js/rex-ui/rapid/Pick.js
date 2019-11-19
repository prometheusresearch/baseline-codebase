/**
 * @flow
 */

import * as React from "react";

import { useQuery, type Endpoint, type Result } from "rex-graphql";
import * as Resource from "rex-graphql/Resource";

import * as QueryPath from "./QueryPath.js";
import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import { buildQuery } from "./buildQuery";
import { PickRenderer, type PickRendererConfigProps } from "./PickRenderer.js";
import * as Field from "./Field.js";
import { ErrorBoundary } from "./ErrorBoundary.js";
import { buildSortingConfig } from "./buildSortingConfig.js";

export type PickProps = {|
  endpoint: Endpoint,
  fields?: ?(Field.FieldConfig[]),
  args?: { [key: string]: any },
  filters?: ?Array<FilterConfig>,
  ...PickRendererConfigProps,
|};

export type FilterConfig =
  | string
  | {
      name: string,
      render?: React.AbstractComponent<{
        value: any,
        values?: Array<any>,
        onChange: (newValue: any) => void,
      }>,
    };

export type FilterSpec = {|
  render: ?React.ComponentType<{
    value: any,
    values?: Array<any>,
    onChange: (newValue: any) => void,
  }>,
|};

export type FilterSpecMap = Map<string, FilterSpec>;

export type FiltersConfig = FilterConfig[];

export const SORTING_VAR_NAME = "sort";

const filtersConfigToSpecs = (configs: ?FiltersConfig): ?FilterSpecMap => {
  if (configs == null || configs.length === 0) {
    return null;
  }
  let SpecMap: FilterSpecMap = new Map();

  for (let config of configs) {
    if (typeof config === "string") {
      SpecMap.set(config, { render: null });
    } else if (typeof config === "object") {
      SpecMap.set(config.name, { render: config.render });
    }
  }

  return SpecMap;
};

export let PickBase = (props: PickProps) => {
  let {
    endpoint,
    fields = null,
    fetch,
    filters,
    sortableColumns,
    ...rest
  } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let {
    resource,
    fieldSpecs,
    introspectionTypesMap,
    queryDefinition,
    fieldDescription,
  } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let fieldSpecs = Field.configureFields(fields);
    let {
      query,
      queryDefinition,
      introspectionTypesMap,
      fields: nextFieldSpecs,
      fieldDescription,
    } = buildQuery({
      schema,
      path,
      fields: fieldSpecs,
    });
    let resource = Resource.defineQuery({ query, endpoint });
    return {
      resource,
      fieldSpecs: nextFieldSpecs,
      introspectionTypesMap,
      queryDefinition,
      fieldDescription,
    };
  }, [fetch, schema, endpoint]);

  let [selected, setSelected] = React.useState(new Set());

  const filtersSpecs = filtersConfigToSpecs(filters);

  const sortingConfig = buildSortingConfig({
    variableDefinitions: queryDefinition.variableDefinitions,
    columns: fieldSpecs,
    introspectionTypesMap,
    variableDefinitionName: SORTING_VAR_NAME,
    sortableColumns,
    filtersSpecs,
  });

  return (
    <PickRenderer
      {...rest}
      selected={selected}
      onSelected={setSelected}
      fetch={fetch}
      filtersSpecs={filtersSpecs}
      resource={resource}
      queryDefinition={queryDefinition}
      introspectionTypesMap={introspectionTypesMap}
      columns={fieldSpecs}
      fieldDescription={fieldDescription}
      sortingConfig={sortingConfig}
    />
  );
};

export let Pick = (props: PickProps) => (
  <ErrorBoundary>
    <PickBase {...props} />
  </ErrorBoundary>
);
