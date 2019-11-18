/**
 * @flow
 */

import invariant from "invariant";
import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource";

import { buildQuery } from "./buildQuery";
import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import * as QueryPath from "./QueryPath.js";
import { ShowRenderer } from "./ShowRenderer.js";
import * as Field from "./Field.js";

export type ShowProps = {|
  endpoint: Endpoint,
  fetch: string,
  fields?: ?Field.FieldConfig[],
  args?: { [key: string]: any },
  Renderer?: React.ComponentType<any>,
  renderTitle?: ({| data: any |}) => React.Node
|};

export let Show = (props: ShowProps) => {
  let { fetch, endpoint, fields = null, ...rest } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let { resource, fieldSpecs } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let fieldSpecs = Field.configureFields(fields);
    let { query, ast, fields: nextFieldSpecs } = buildQuery({
      schema,
      path,
      fields: fieldSpecs
    });
    let resource = Resource.defineQuery<void, any>({ endpoint, query });
    return { resource, fieldSpecs: nextFieldSpecs };
  }, [fetch, fields, endpoint, schema]);

  return (
    <ShowRenderer
      {...rest}
      fetch={fetch}
      resource={resource}
      columns={fieldSpecs}
    />
  );
};
