/**
 * @flow
 */

import invariant from "invariant";
import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource";

import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import { buildQuery, type FieldSpec, type FieldConfig } from "./buildQuery";
import { ShowRenderer } from "./show.renderer";
import { getPathFromFetch } from "./helpers";

export type ShowProps = {|
  endpoint: Endpoint,
  fetch: string,
  fields?: FieldConfig[],
  args?: { [key: string]: any },
  Renderer?: React.ComponentType<any>,
  renderTitle?: ({| data: any |}) => React.Node
|};

export let Show = (props: ShowProps) => {
  let { fetch, endpoint, fields: _fields, ...rest } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let { resource, fieldSpecs } = React.useMemo(() => {
    let path = getPathFromFetch(fetch);
    let { query, ast, fieldSpecs } = buildQuery({
      schema,
      path,
      fields: _fields
    });
    let resource = Resource.defineQuery<void, any>({ endpoint, query });
    return { resource, fieldSpecs };
  }, []);

  return (
    <ShowRenderer
      {...rest}
      fetch={fetch}
      resource={resource}
      columns={fieldSpecs}
    />
  );
};
