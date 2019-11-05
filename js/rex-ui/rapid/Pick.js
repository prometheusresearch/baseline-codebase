/**
 * @flow
 */

import * as React from "react";
import invariant from "invariant";

import { useQuery, type Endpoint, type Result } from "rex-graphql";
import * as Resource from "rex-graphql/Resource";

import * as QueryPath from "./QueryPath.js";
import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import { buildQuery } from "./buildQuery";
import { PickRenderer, type PickRendererConfigProps } from "./PickRenderer.js";
import * as Field from "./Field.js";

export type PickProps = {|
  endpoint: Endpoint,
  fields?: Field.FieldConfig[],
  args?: { [key: string]: any },
  ...PickRendererConfigProps
|};

export let Pick = (props: PickProps) => {
  let { endpoint, fields = null, fetch, ...rest } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let {
    resource,
    fieldSpecs,
    introspectionTypesMap,
    queryDefinition
  } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let fieldSpecs = Field.configureFields(fields);
    let {
      query,
      queryDefinition,
      introspectionTypesMap,
      fields: nextFieldSpecs
    } = buildQuery({
      schema,
      path,
      fields: fieldSpecs
    });
    let resource = Resource.defineQuery({ query, endpoint });
    return {
      resource,
      fieldSpecs: nextFieldSpecs,
      introspectionTypesMap,
      queryDefinition
    };
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
