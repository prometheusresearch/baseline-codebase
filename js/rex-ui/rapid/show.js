/**
 * @flow
 */

import * as React from "react";
import invariant from "invariant";
import type { StatelessFunctionalComponent } from "react";
import {
  introspectionFromSchema,
  buildClientSchema,
  getIntrospectionQuery,
  type IntrospectionQuery
} from "graphql";
import { GraphQLSchema } from "graphql/type/schema";
import type {
  ASTNode,
  FieldNode,
  SelectionSetNode
} from "graphql/language/ast";
import { parse as gqlParse } from "graphql/language/parser";
import { print as gqlPrint } from "graphql/language/printer";

import { useQuery, type Endpoint, type Result } from "rex-graphql";
import {
  type Resource,
  defineQuery,
  unstable_useResource as useResource
} from "rex-graphql/Resource";

import { WithResource } from "./WithResource";
import { buildQuery } from "./buildQuery";
import { ComponentLoading } from "./component.loading";
import { ComponentError } from "./component.error";
import { ShowRenderer } from "./show.renderer";
import {
  toJS,
  withResourceErrorCatcher,
  withCatcher,
  getPathFromFetch
} from "./helpers";

export type ShowPropsBase = {|
  endpoint: Endpoint,
  fetch: string,
  fields?: Array<string>,
  args?: { [key: string]: any },
  Renderer?: React.ComponentType<any>
|};

export type ShowProps<P, V> = {|
  ...ShowPropsBase,
  resource?: Resource<P, V>
|};

const ShowBase = (props: ShowProps<void, IntrospectionQuery>) => {
  const { endpoint, fetch, fields, resource, Renderer, args } = props;

  const [error, setError] = React.useState<Error | null>(null);
  // GQL Schema
  const [meta, setMeta] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<?Error>(null);

  const catcher = React.useMemo(
    () => (error: Error) => {
      setErr(error);
    },
    [err, setErr]
  );

  const resourceData = withResourceErrorCatcher({
    getResource: () => useResource((resource: any)),
    catcher
  });

  if (err) {
    return <ComponentError message={err.message} />;
  }

  const introspectionQuery: IntrospectionQuery = (resourceData: any);
  const clientSchema = buildClientSchema(introspectionQuery);
  const introspectionQueryFromSchema: IntrospectionQuery = introspectionFromSchema(
    clientSchema
  );

  const path = withCatcher(() => getPathFromFetch(fetch), catcher, []);

  const schema = introspectionQueryFromSchema.__schema;

  const { query, ast, columns } = withCatcher(
    () =>
      buildQuery({
        schema,
        path
      }),
    catcher,
    {}
  );

  return (
    <WithResource
      endpoint={endpoint}
      query={query}
      Renderer={ShowRenderer}
      passProps={{
        Renderer,
        catcher,
        fetch,
        ast,
        args
      }}
    />
  );
};

export const Show = (props: ShowPropsBase) => {
  const { endpoint } = props;

  return (
    <WithResource
      endpoint={endpoint}
      Renderer={ShowBase}
      query={getIntrospectionQuery()}
      passProps={props}
    />
  );
};
