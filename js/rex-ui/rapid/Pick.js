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

export type PickProps = {|
  endpoint: Endpoint,
  fields?: ?(Field.FieldConfig[]),
  args?: { [key: string]: any },
  ...PickRendererConfigProps,
|};

export let PickBase = (props: PickProps) => {
  let { endpoint, fields = null, fetch, ...rest } = props;
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

  return (
    <PickRenderer
      {...rest}
      selected={selected}
      onSelected={setSelected}
      fetch={fetch}
      resource={resource}
      queryDefinition={queryDefinition}
      introspectionTypesMap={introspectionTypesMap}
      columns={fieldSpecs}
      fieldDescription={fieldDescription}
    />
  );
};

export let Pick = (props: PickProps) => (
  <ErrorBoundary>
    <PickBase {...props} />
  </ErrorBoundary>
);
