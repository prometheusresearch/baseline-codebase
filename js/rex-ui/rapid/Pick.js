/**
 * @flow
 */

import * as React from "react";

import { useQuery, type Endpoint, type Result } from "rex-graphql";
import * as Resource from "rex-graphql/Resource";
import * as Resource2 from "rex-graphql/Resource2";

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

export type PickProps2<V, R, O: { [key: string]: any }> = {|
  endpoint: Endpoint,
  fields?: ?{ [name: string]: Field.FieldConfig },
  resource: Resource2.Resource<V, R>,
  getRows: R => Array<O>,
  fieldSpecs: { [name: $Keys<O>]: Field.FieldSpec },
  filters?: ?Array<Field.FilterConfig>,
  ...PickRendererConfigProps,
|};

export let PickBase = (props: PickProps2<any, any, any>) => {
  let { endpoint, fields, fetch, filters, resource: res2, ...rest } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  console.log(res2);

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

export let Pick = (props: PickProps2<any, any, any>) => (
  <ErrorBoundary>
    <PickBase {...props} />
  </ErrorBoundary>
);
