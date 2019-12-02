/**
 * @flow
 */

import invariant from "invariant";
import { ConfigError } from "./ErrorBoundary";

export opaque type QueryPath = string[];

export const make = (value: string | string[] | QueryPath): QueryPath => {
  let path = [];
  if (!Array.isArray(value)) {
    path = value.split(".");
  }
  if (Array.isArray(value)) {
    for (let v of value) {
      path.push(v);
    }
  }
  if (path.length == 0) {
    throw new ConfigError("QueryPath could not be empty");
  }
  return path;
};

export function toArray(path: QueryPath): string[] {
  return path;
}
