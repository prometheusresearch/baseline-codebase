/**
 * @flow
 */
import invariant from "invariant";

export const getPathFromFetch = (fetch: string): string[] => {
  const path = fetch.split(".");
  invariant(fetch != "", "fetch is empty string");
  invariant(path.length != 0, "fetch is empty string");

  return path;
};
