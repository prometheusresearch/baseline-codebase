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
import { ShowRenderer, type ShowRendererConfigProps } from "./ShowRenderer.js";
import * as Field from "./Field.js";

export type ShowProps = {|
  endpoint: Endpoint,
  fetch: string,
  fields?: ?(Field.FieldConfig[]),
  args?: { [key: string]: any },
  ...ShowRendererConfigProps,
|};

export let Show = (props: ShowProps) => {
  let { fetch, endpoint, fields = null, ...rest } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let { resource, fieldSpecs, path } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let fieldSpecs = Field.configureFields(fields);
    let { query, ast, fields: nextFieldSpecs } = buildQuery({
      schema,
      path,
      fields: fieldSpecs,
    });
    let resource = Resource.defineQuery<void, any>({ endpoint, query });
    return { path, resource, fieldSpecs: nextFieldSpecs };
  }, [fetch, fields, endpoint, schema]);

  return (
    <ShowRenderer
      {...rest}
      path={path}
      resource={resource}
      fieldSpecs={fieldSpecs}
    />
  );
};
