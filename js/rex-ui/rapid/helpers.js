/**
 * @flow
 */
import invariant from "invariant";
import { type Resource } from "rex-graphql/Resource";

export function toJS<T, U>(
  promise: Promise<T>
): Promise<[U | null, T | typeof undefined]> {
  return promise
    .then((data: T) => [null, data])
    .catch((err: U) => {
      return [err, undefined];
    });
}

export const getPathFromFetch = (fetch: string): string[] => {
  const path = fetch.split(".");

  invariant(fetch != "", "fetch is empty string");
  invariant(path.length != 0, "fetch is empty string");

  return path;
};

export const withCatcher = <T>(
  fn: () => T,
  catcher: (err: Error) => any,
  defaultValue: T
): T => {
  let result = defaultValue;

  try {
    result = fn();
  } catch (err) {
    catcher(err);
  }

  return result;
};

export const withResourceErrorCatcher = ({
  getResource,
  catcher
}: {
  getResource: () => Resource<any, any>,
  catcher?: (err: Error) => void
}) => {
  let data: Resource<any, any>;

  try {
    data = getResource();
  } catch (something) {
    if (something instanceof Promise) {
      throw something;
    }

    if (something instanceof Error) {
      // No catcher, so throw the error up
      if (!catcher) {
        throw something;
      }
      catcher(something);
    }
  }

  return data;
};
