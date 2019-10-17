/**
 * @flow
 */

import * as React from "react";

import { type Resource } from "rex-graphql/Resource";
import { unstable_useResource as useResource } from "rex-graphql/Resource";

import { defaultCatcher } from "../../helpers/defaultCatcher";
import { withResourceErrorCatcher } from "../../helpers/withResourceErrorCatcher";

import { ComponentLoading } from "../../components/ComponentLoading";

import type { TRendererProps, TShowProps, TShowPropsBase } from "./types";

const ViewRendererSuspended = ({ resource, Renderer }: TRendererProps) => {
  const resourceData = withResourceErrorCatcher({
    getResource: () => useResource(resource),
    catcher: defaultCatcher
  });

  const whatToRender = Renderer ? (
    <Renderer data={resourceData} />
  ) : (
    <div>
      <h4>Resource data is:</h4>
      <div>{JSON.stringify(resourceData, null, 2)}</div>
    </div>
  );

  return whatToRender;
};

export const ViewRenderer = ({
  resource,
  Renderer,
  ...rest
}: {
  ...TRendererProps
}) => (
  <React.Suspense fallback={ComponentLoading}>
    <ViewRendererSuspended resource={resource} {...rest} Renderer={Renderer} />
  </React.Suspense>
);
