// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RexGraphQL from "rex-graphql";
import {
  defineQuery,
  unstable_useResource as useResource
} from "rex-graphql/Resource";
import { Show } from "rex-ui/rapid/lib/show/Show";

const endpoint = RexGraphQL.configure("/_api/graphql");

function App() {
  return (
    <div>
      <Show endpoint={`/_api/graphql`} fetch={"users.paginated"} />
    </div>
  );
}

let root = document.getElementById("root");
invariant(root != null, "DOM is not avaialble: missing #root");

ReactDOM.render(<App />, root);
