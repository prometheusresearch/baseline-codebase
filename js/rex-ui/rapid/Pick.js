/**
 * @flow
 */

import * as React from "react";

import { useQuery, type Endpoint, type Result } from "rex-graphql";
import * as Resource from "rex-graphql/Resource";

import * as QueryPath from "./QueryPath.js";
import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import { introspect } from "./Introspection";
import { PickRenderer, type PickRendererConfigProps } from "./PickRenderer.js";
import * as Field from "./Field.js";
import { ErrorBoundary } from "./ErrorBoundary.js";
import { buildSortingConfig } from "./buildSortingConfig.js";

export type PickProps = {|
  endpoint: Endpoint,
  fields?: ?(Field.FieldConfig[]),
  args?: { [key: string]: any },
  filters?: ?Array<Field.FilterConfig>,
  ...PickRendererConfigProps,
|};

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
    filterSpecs,
    introspectionTypesMap,
    queryDefinition,
    description: fieldDescription,
    sortingConfig,
  } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let {
      query,
      queryDefinition,
      introspectionTypesMap,
      fieldSpecs,
      description,
      filterSpecs,
      sortingConfig,
    } = introspect({
      schema,
      path,
      fields,
      filters,
      sortableColumns,
    });
    let resource = Resource.defineQuery({ query, endpoint });
    return {
      resource,
      fieldSpecs,
      filterSpecs,
      introspectionTypesMap,
      queryDefinition,
      description,
      sortingConfig,
    };
  }, [fetch, schema, endpoint, filters]);

  let [selected, setSelected] = React.useState(new Set());

  let variablesMap = null;
  if (
    queryDefinition.variableDefinitions &&
    queryDefinition.variableDefinitions.length > 0
  ) {
    variablesMap = new Map();

    for (let variable of queryDefinition.variableDefinitions) {
      variablesMap.set(variable.variable.name.value, variable);
    }
  }

  return (
    <PickRenderer
      {...rest}
      selected={selected}
      onSelected={setSelected}
      fetch={fetch}
      filterSpecs={filterSpecs}
      resource={resource}
      variablesMap={variablesMap}
      fieldSpecs={fieldSpecs}
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
