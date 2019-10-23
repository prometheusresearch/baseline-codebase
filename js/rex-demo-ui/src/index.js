// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RexGraphQL from "rex-graphql";
import { Pick, ComponentLoading } from "rex-ui/rapid";

const endpoint = RexGraphQL.configure("/_api/graphql");

function App() {
  return <Pick endpoint={endpoint} fetch={"user.paginated"} />;
}

let root = document.getElementById("root");
invariant(root != null, "DOM is not avaialble: missing #root");

ReactDOM.render(
  <React.Suspense fallback={ComponentLoading}>
    <App />
  </React.Suspense>,
  root
);
