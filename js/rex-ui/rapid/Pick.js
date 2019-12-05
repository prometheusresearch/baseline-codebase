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
  fields?: ?{ [name: string]: Field.FieldConfig },
  args?: { [key: string]: any },
  filters?: ?Array<Field.FilterConfig>,
  ...PickRendererConfigProps,
|};

export let PickBase = (props: PickProps) => {
  let { endpoint, fields, fetch, filters, ...rest } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let {
    resource,
    fieldSpecs,
    filterSpecs,
    description: fieldDescription,
    sortingConfig,
    variablesMap,
  } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let {
      query,
      fieldSpecs,
      description,
      filterSpecs,
      sortingConfig,
      variablesMap,
    } = introspect({
      schema,
      path,
      fields,
      filters,
    });
    let resource = Resource.defineQuery({ query, endpoint });
    return {
      resource,
      fieldSpecs,
      filterSpecs,
      description,
      sortingConfig,
      variablesMap,
    };
  }, [fetch, schema, endpoint, filters]);

  let [selected, setSelected] = React.useState(new Set());

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
