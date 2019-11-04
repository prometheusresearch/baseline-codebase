/**
 * @flow
 */

import * as React from "react";
import invariant from "invariant";
import type { StatelessFunctionalComponent } from "react";
import { getIntrospectionQuery, type IntrospectionQuery } from "graphql";

import { type Endpoint } from "rex-graphql";
import {
  defineQuery,
  unstable_useResource as useResource
} from "rex-graphql/Resource";

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

export const Show = (props: ShowProps) => {
  const { endpoint } = props;

  // Configure resource for fetching endpoint introspection.
  let resourceIntrospection = React.useMemo(
    () =>
      defineQuery<void, IntrospectionQuery>({
        endpoint,
        query: getIntrospectionQuery()
      }),
    [endpoint]
  );

  // Create component which fetch endpoint introspection, configures resource
  // for data based on props and then renders <ShowRenderer />.
  let ShowWithResource = React.useCallback(
    (props: ShowProps) => {
      const { fetch, endpoint, fields: _fields, ...rest } = props;
      const introspection = useResource(resourceIntrospection);
      let { resource, fieldSpecs } = React.useMemo(() => {
        const path = getPathFromFetch(fetch);
        const schema = introspection.__schema;
        const { query, ast, fieldSpecs } = buildQuery({
          schema,
          path,
          fields: _fields
        });
        const resource = defineQuery<void, any>({ endpoint, query });
        return { resource, fieldSpecs };
      }, [introspection, endpoint, fetch]);

      return (
        <ShowRenderer
          {...rest}
          fetch={fetch}
          resource={resource}
          columns={fieldSpecs}
        />
      );
    },
    [resourceIntrospection]
  );

  return <ShowWithResource {...props} />;
};
