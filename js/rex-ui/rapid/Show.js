/**
 * @flow
 */

import invariant from "invariant";
import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource";

import { introspect } from "./Introspection";
import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import * as QueryPath from "./QueryPath.js";
import { ShowRenderer, type ShowRendererConfigProps } from "./ShowRenderer.js";
import * as Field from "./Field.js";

export type ShowProps = {|
  endpoint: Endpoint,
  fetch: string,
  fields?: ?{ [name: string]: Field.FieldConfig },
  args?: { [key: string]: any },
  onAdd?: () => void,
  onRemove?: () => void,
  ...ShowRendererConfigProps,
|};

export let Show = (props: ShowProps) => {
  let { fetch, endpoint, fields = null, ...rest } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let { resource, fieldSpecs, path } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let { query, fieldSpecs } = introspect({
      schema,
      path,
      fields,
    });
    let resource = Resource.defineQuery<void, any>({ endpoint, query });
    return { path, resource, fieldSpecs };
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
