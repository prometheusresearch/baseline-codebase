// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";

function App() {
  return <div>Hello</div>;
}

let root = document.getElementById("root");
invariant(root != null, "DOM is not avaialble: missing #root");

ReactDOM.render(<App />, root);
