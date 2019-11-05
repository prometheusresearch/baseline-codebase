/**
 * @flow
 */

import * as React from "react";
import invariant from "invariant";
import {
  introspectionFromSchema,
  buildClientSchema,
  getIntrospectionQuery,
  type IntrospectionQuery,
  type IntrospectionSchema
} from "graphql";
import { GraphQLSchema } from "graphql/type/schema";
import type {
  ASTNode,
  FieldNode,
  SelectionSetNode,
  OperationDefinitionNode
} from "graphql/language/ast";
import { parse as gqlParse } from "graphql/language/parser";
import { print as gqlPrint } from "graphql/language/printer";

import { useQuery, type Endpoint, type Result } from "rex-graphql";
import {
  type Resource,
  defineQuery,
  unstable_useResource as useResource
} from "rex-graphql/Resource";

import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import { WithResource } from "./WithResource";
import { buildQuery, type FieldSpec, type FieldConfig } from "./buildQuery";
import { ComponentLoading } from "./component.loading";
import { ComponentError } from "./component.error";
import { PickRenderer } from "./pick.renderer";
import { complexQuery } from "./data.examples";
import {
  withResourceErrorCatcher,
  withCatcher,
  getPathFromFetch
} from "./helpers";

export type PropsSharedWithRenderer = {|
  fetch: string,
  isRowClickable?: boolean,
  title?: string,
  description?: string,

  RendererColumnCell?: (props: {
    column?: FieldSpec,
    index: number
  }) => React.Node,
  RendererRow?: (props: {
    columns?: FieldSpec[],
    row?: any,
    index: number
  }) => React.Node,
  RendererRowCell?: (props: {
    column?: FieldSpec,
    row?: any,
    index: number
  }) => React.Node,
  onRowClick?: (row: any) => void
|};

export type TypeSchemaMeta = {| ...Object |};

const makeNodeToSpec = (nodes: FieldNode[] = []): FieldSpec[] => {
  return nodes.map(node => {
    return {
      require: {
        field: node.name.value,
        require: []
      }
    };
  });
};

type PickBaseProps = {|
  ...PickProps,
  schema: IntrospectionSchema
|};

const PickBase = (props: PickBaseProps) => {
  const {
    endpoint,
    fetch,
    fields,
    Renderer,
    RendererColumnCell,
    RendererRowCell,
    RendererRow,
    isRowClickable,
    onRowClick,
    args = {},
    title,
    description,
    schema
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

  if (err) {
    return <ComponentError message={err.message} />;
  }

  const path = withCatcher(() => getPathFromFetch(fetch), catcher, []);

  const {
    query,
    queryDefinition,
    introspectionTypesMap,
    fieldSpecs
  } = withCatcher(
    () =>
      buildQuery({
        schema,
        path,
        fields
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
        queryDefinition,
        introspectionTypesMap,
        columns: fieldSpecs,
        RendererColumnCell,
        RendererRowCell,
        RendererRow,
        isRowClickable,
        onRowClick,
        args,
        title,
        description
      }}
    />
  );
};

export type PickProps = {|
  endpoint: Endpoint,
  fields?: FieldConfig[],
  Renderer?: React.ComponentType<any>,
  onPick?: () => void,
  args?: { [key: string]: any },
  ...PropsSharedWithRenderer
|};

export const Pick = (props: PickProps) => {
  const { endpoint } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);
  return <PickBase {...props} schema={schema} />;
};
