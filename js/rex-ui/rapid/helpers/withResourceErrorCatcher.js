/**
 * @flow
 */

import { type Resource } from "rex-graphql/Resource";

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
