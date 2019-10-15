// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RexGraphQL from "rex-graphql";
import {
  defineQuery,
  unstable_useResource as useResource
} from "rex-graphql/Resource";

function WithResource({ endpoint, render: Render }) {
  let resource = React.useMemo(
    () =>
      defineQuery<void, any>({
        endpoint,
        query: `
        query {
          __schema {
            types { name }
          }
        }
      `
      }),
    [endpoint]
  );
  return <Render resource={resource} />;
}

function App({ resource }) {
  let data = useResource(resource);
  return <div>{JSON.stringify(data, null, 2)}</div>;
}

let root = document.getElementById("root");
invariant(root != null, "DOM is not avaialble: missing #root");

let endpoint = RexGraphQL.configure("/_api/graphql");

ReactDOM.render(
  <React.Suspense fallback={<div>Loading...</div>}>
    <WithResource endpoint={endpoint} render={App} />
  </React.Suspense>,
  root
);
