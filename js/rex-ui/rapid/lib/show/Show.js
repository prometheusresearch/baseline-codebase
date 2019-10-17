/**
 * @flow
 */

import * as React from "react";
import type { StatelessFunctionalComponent } from "react";

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
import { constructQueryFromInterspection } from "../../helpers/constructors/constructQueryFromInterspection";
import { constructVariablesFromInterspection } from "../../helpers/constructors/constructVariablesFromInterspection";

import { ViewRenderer } from "./ViewRenderer";
import type { TRendererProps, TShowProps, TShowPropsBase } from "./types";

const ShowSuspended = (props: TShowProps) => {
  const { endpoint, fetch, fields, resource, Renderer } = props;

  // GQL Schema
  const [meta, setMeta] = React.useState<string | null>(null);

  const constructedQuery = constructQueryFromInterspection({
    meta,
    path: fetch,
    fields
  });

  const constructedVariables = constructVariablesFromInterspection({
    meta,
    path: fetch,
    fields
  });

  const resourceData = withResourceErrorCatcher({
    getResource: () => useResource(resource, constructedVariables),
    catcher: defaultCatcher
  });

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
