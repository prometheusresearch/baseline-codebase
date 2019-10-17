/**
 * @flow
 */

import { type Resource } from "rex-graphql/Resource";

export const withResourceErrorCatcher = ({
  getResource,
  catcher
}: {
  getResource: () => Resource<void, any>,
  catcher?: (err: Error) => void
}) => {
  let data: Resource<void, any>;

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
