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
import { PickRenderer } from "./pick.renderer";
import { complexQuery } from "./data.examples";
import {
  toJS,
  withResourceErrorCatcher,
  withCatcher,
  getPathFromFetch
} from "./helpers";

export type PropsSharedWithRenderer = {|
  fetch: string,
  isRowClickable?: boolean,

  RendererColumnCell?: (props: {
    column?: FieldNode,
    index: number
  }) => React.Node,
  RendererRow?: (props: {
    columns?: FieldNode[],
    row?: any,
    index: number
  }) => React.Node,
  RendererRowCell?: (props: {
    column?: FieldNode,
    row?: any,
    index: number
  }) => React.Node,
  onRowClick?: (row: any) => void
|};

export type PickPropsBase = {|
  endpoint: Endpoint,
  fields?: Array<string>,
  Renderer?: React.ComponentType<any>,
  onPick?: () => void,
  ...PropsSharedWithRenderer
|};

export type PickProps<P, V> = {|
  ...PickPropsBase,
  resource?: Resource<P, V>
|};

export type TypeSchemaMeta = {| ...Object |};

const PickBase = (props: PickProps<void, IntrospectionQuery>) => {
  const {
    endpoint,
    fetch,
    fields,
    resource,
    Renderer,
    RendererColumnCell,
    RendererRowCell,
    RendererRow,
    isRowClickable,
    onRowClick
  } = props;

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
      Renderer={PickRenderer}
      passProps={{
        Renderer,
        catcher,
        fetch,
        ast,
        columns,
        RendererColumnCell,
        RendererRowCell,
        RendererRow,
        isRowClickable,
        onRowClick
      }}
    />
  );
};

export const Pick = (props: PickPropsBase) => {
  const { endpoint } = props;

  return (
    <WithResource
      endpoint={endpoint}
      Renderer={PickBase}
      query={getIntrospectionQuery()}
      passProps={props}
    />
  );
};
