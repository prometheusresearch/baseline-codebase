// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RexGraphQL from "rex-graphql";
import {
  defineQuery,
  unstable_useResource as useResource
} from "rex-graphql/Resource";
import { Pick } from "rex-ui/rapid/lib/pick/Pick";

const endpoint = RexGraphQL.configure("/_api/graphql");

function App() {
  return <Pick endpoint={`/_api/graphql`} fetch={"user.paginated"} />;
}

let root = document.getElementById("root");
invariant(root != null, "DOM is not avaialble: missing #root");

ReactDOM.render(<App />, root);
