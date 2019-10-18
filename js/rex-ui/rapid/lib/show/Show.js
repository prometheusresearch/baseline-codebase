/**
 * @flow
 */

import * as React from "react";
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

import { SCHEMA_QUERY } from "../../queries/schema";

import { toJS } from "../../helpers/awaitToJS";
import { defaultCatcher } from "../../helpers/defaultCatcher";
import { withResourceErrorCatcher } from "../../helpers/withResourceErrorCatcher";
import { constructQuery } from "../../constructors/constructQuery";
import { constructVariablesFromInterspection } from "../../constructors/constructVariablesFromInterspection";

import { ViewRenderer } from "./ViewRenderer";
import { TRendererProps, TShowProps, TShowPropsBase } from "./types";

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

const ShowSuspended = (props: TShowProps<{}, IntrospectionQuery>) => {
  const { endpoint, fetch, fields, resource, Renderer } = props;

  const [error, setError] = React.useState<Error | null>(null);
  // GQL Schema
  const [meta, setMeta] = React.useState<string | null>(null);

  const resourceData = withResourceErrorCatcher({
    getResource: () => useResource(resource),
    catcher: defaultCatcher
  });

  if (resourceData instanceof Object === false) {
    return null;
  }

  // TODO: Fix resourceData typing
  const clientSchema = buildClientSchema((resourceData: any));
  const introspectionQueryFromSchema: IntrospectionQuery = introspectionFromSchema(
    clientSchema
  );

  const path = String(fetch).split(".");

  const schema = introspectionQueryFromSchema.__schema;

  const constructedQueryAST = constructQueryAST({
    schema,
    path: ["user", "all"]
  });
  const constructedQuery = constructQuery(constructedQueryAST);

  return (
    <React.Suspense fallback={ComponentLoading}>
      <WithResource
        endpoint={endpoint}
        query={constructedQuery}
        Renderer={ViewRenderer}
        passProps={{ Renderer }}
      />
    </React.Suspense>
  );
};

export const Show = (props: TShowPropsBase) => {
  const { endpoint } = props;

  return (
    <React.Suspense fallback={ComponentLoading}>
      <WithResource
        endpoint={endpoint}
        Renderer={ShowSuspended}
        query={SCHEMA_QUERY}
        passProps={props}
      />
    </React.Suspense>
  );
};
