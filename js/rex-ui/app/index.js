/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
export { urlFor } from "./url.js";
export { default as useBasename } from "./useBasename.js";
export { default as App } from "./App.js";
export { default as AppChrome } from "./AppChrome.js";
export { route, redirect, loc } from "./Route.js";
export type { Loc } from "./Route.js";

export function start(app: React.Element<any>, rootspec: string | HTMLElement) {
  invariant(document.documentElement != null, "no DOM found");
  document.documentElement.style.height = "100%";
  invariant(document.body != null, "no DOM found");
  document.body.style.height = "100%";

  let root;
  if (typeof rootspec === "string") {
    root = document.querySelector(rootspec);
    invariant(root != null, `Cannot found DOM element ${rootspec}`);
  } else {
    root = rootspec;
  }

  root.style.height = "100%";
  ReactDOM.render(app, root);
}
