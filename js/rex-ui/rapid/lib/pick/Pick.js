/**
 * @flow
 */

import * as React from "react";
import invariant from "invariant";
import type { StatelessFunctionalComponent } from "react";
import {
  introspectionFromSchema,
  buildClientSchema,
  buildASTSchema,
  printIntrospectionSchema,
  astFromValue,
  getIntrospectionQuery,
  type IntrospectionType,
  type GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  type IntrospectionQuery,
  type IntrospectionSchema
} from "graphql";

import { useQuery } from "rex-graphql";
import { type Resource } from "rex-graphql/Resource";
import type { Endpoint, Result } from "rex-graphql";
import {
  defineQuery,
  unstable_useResource as useResource
} from "rex-graphql/Resource";

import { WithResource } from "../../hoc/WithResource";

import { ComponentLoading } from "../../components/ComponentLoading";

import { toJS } from "../../helpers/awaitToJS";

import { withResourceErrorCatcher } from "../../helpers/withResourceErrorCatcher";
import { constructQuery } from "../../constructors/constructQuery";

import { ViewRenderer } from "./ViewRenderer";
import type { TPickProps, TPickPropsBase } from "./types";

import { GraphQLSchema } from "graphql/type/schema";
import type {
  ASTNode,
  FieldNode,
  SelectionSetNode
} from "graphql/language/ast";
import { parse as gqlParse } from "graphql/language/parser";
import { print as gqlPrint } from "graphql/language/printer";
import { complexQuery } from "./data.examples";
import { constructQueryAST } from "../../constructors/constructQueryAST";
import { ErrorRenderer } from "../../components/ErrorRenderer";
import { withCatcher } from "../../helpers/withCatcher";
import { getPathFromFetch } from "../../helpers/getPathFromFetch";

const ShowSuspended = (props: TPickProps<{}, IntrospectionQuery>) => {
  const { endpoint, fetch, fields, resource, Renderer } = props;

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
    return <ErrorRenderer message={err.message} />;
  }

  const resourceData = withResourceErrorCatcher({
    getResource: () => useResource(resource),
    catcher
  });

  const introspectionQuery: IntrospectionQuery = (resourceData: any);
  const clientSchema = buildClientSchema(introspectionQuery);
  const introspectionQueryFromSchema: IntrospectionQuery = introspectionFromSchema(
    clientSchema
  );

  const path = withCatcher(() => getPathFromFetch(fetch), catcher, []);

  const schema = introspectionQueryFromSchema.__schema;

  const constructedQueryAST = withCatcher(
    () =>
      constructQueryAST({
        schema,
        path
      }),
    catcher,
    null
  );

  if (constructedQueryAST == null) {
    catcher(new Error("constructedQueryAST is null"));
    return null;
  }

  const constructedQuery = withCatcher(
    () => constructQuery(constructedQueryAST),
    catcher,
    ""
  );

  return (
    <React.Suspense fallback={ComponentLoading}>
      <WithResource
        endpoint={endpoint}
        query={constructedQuery}
        Renderer={ViewRenderer}
        passProps={{ Renderer, catcher, fetch }}
      />
    </React.Suspense>
  );
};

export const Pick = (props: TPickPropsBase) => {
  const { endpoint } = props;

  return (
    <React.Suspense fallback={ComponentLoading}>
      <WithResource
        endpoint={endpoint}
        Renderer={ShowSuspended}
        query={getIntrospectionQuery()}
        passProps={props}
      />
    </React.Suspense>
  );
};
