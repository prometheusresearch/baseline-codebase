/**
 * @flow
 */

import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource";

import * as QueryPath from "./QueryPath.js";
import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import { introspect } from "./Introspection";
import { PickRenderer, type PickRendererConfigProps } from "./PickRenderer.js";
import * as Field from "./Field.js";
import { ErrorBoundary } from "./ErrorBoundary.js";

export type PickProps = {|
  endpoint: Endpoint,
  fields?: ?{ [name: string]: Field.FieldConfig },
  args?: { [key: string]: any },
  filters?: ?Array<Field.FilterConfig>,
  ...PickRendererConfigProps,
|};

export type PickProps2<V, R, O: { [name: string]: mixed }> = {|
  endpoint: Endpoint,
  fields?: ?{ [name: string]: Field.FieldConfig },
  resource: Resource2.Resource<V, R>,
  getRows: R => Array<O>,
  fieldSpecs: { [name: $Keys<O>]: Field.FieldSpec },
  filters?: ?Array<Field.FilterConfig>,
  ...PickRendererConfigProps,
|};

export let PickBase = <V, R, O: { [name: string]: mixed }>(
  props: PickProps2<V, R, O>,
) => {
  let {
    endpoint,
    fields,
    fetch,
    filters,
    resource: res2,
    getRows: _getRows,
    ...rest
  } = props;
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

export let Pick = <V, R, O: { [name: string]: mixed }>(
  props: PickProps2<V, R, O>,
) => (
  <ErrorBoundary>
    <PickBase {...props} />
  </ErrorBoundary>
);
