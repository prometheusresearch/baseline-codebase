/**
 * @flow
 */

import invariant from "invariant";

export opaque type QueryPath = string[];

export const make = (value: string | string[] | QueryPath): QueryPath => {
  let path = [];
  if (!Array.isArray(value)) {
    path = value.split(".");
  }
  invariant(path.length != 0, "QueryPath could not be empty");
  return path;
};

export function toArray(path: QueryPath): string[] {
  return path;
}
