/**
 * @flow
 */

import * as React from "react";
import invariant from "invariant";

import { useQuery, type Endpoint, type Result } from "rex-graphql";
import * as Resource from "rex-graphql/Resource";

import * as QueryPath from "./QueryPath.js";
import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import { buildQuery, type FieldSpec, type FieldConfig } from "./buildQuery";
import { PickRenderer, type PickRendererConfigProps } from "./pick.renderer";

export type PickProps = {|
  endpoint: Endpoint,
  fields?: FieldConfig[],
  args?: { [key: string]: any },
  ...PickRendererConfigProps
|};

export let Pick = (props: PickProps) => {
  let { endpoint, fields, fetch, ...rest } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let {
    resource,
    fieldSpecs,
    introspectionTypesMap,
    queryDefinition
  } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let {
      query,
      queryDefinition,
      introspectionTypesMap,
      fieldSpecs
    } = buildQuery({
      schema,
      path,
      fields
    });
    let resource = Resource.defineQuery({ query, endpoint });
    return { resource, fieldSpecs, introspectionTypesMap, queryDefinition };
  }, [fetch, schema, endpoint]);

  return (
    <PickRenderer
      {...rest}
      fetch={fetch}
      resource={resource}
      queryDefinition={queryDefinition}
      introspectionTypesMap={introspectionTypesMap}
      columns={fieldSpecs}
    />
  );
};
