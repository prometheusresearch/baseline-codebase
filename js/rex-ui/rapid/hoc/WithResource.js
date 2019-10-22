/**
 * @flow
 */

import * as React from "react";
import { type Endpoint } from "rex-graphql";
import { defineQuery, type Resource } from "rex-graphql/Resource";
import { getIntrospectionQuery } from "graphql";

export function WithResource<R>({
  endpoint,
  query = getIntrospectionQuery(),
  Renderer,
  passProps,
  children
}: {|
  endpoint: Endpoint,
  Renderer: React.ComponentType<{| ...R, resource: Resource<void, any> |}>,
  query?: string,
  passProps?: R,
  children?: ?React.Node
|}) {
  let resource = React.useMemo(
    () =>
      defineQuery<void, any>({
        endpoint,
        query
      }),
    [endpoint, query]
  );

  return (
    <Renderer resource={resource} {...passProps}>
      {children}
    </Renderer>
  );
}
