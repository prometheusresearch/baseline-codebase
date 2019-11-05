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

export const calculateItemsLimit = ({
  coords,
  cellStaticHeightValue
}: {
  coords: ClientRect,
  cellStaticHeightValue: number
}) => {
  const height = window.innerHeight;

  let limit: number = 3;
  const delta = window.innerHeight - coords.height;
  const rate = delta / cellStaticHeightValue;

  if (rate > 3) {
    return Math.floor(rate) - 1;
  }

  return limit;
};

// TODO: Add "preferred" argument with fields
export const sortObjectFieldsWithPreferred = (row: Object): Object => {
  const {
    id,
    name,
    first_name,
    last_name,
    title,
    display_name,
    gender,
    sex,
    ...rest
  } = row;
  const sortedRow = Object.keys(rest)
    .sort()
    .reduce((acc, dataKey) => ({ ...acc, [dataKey]: rest[dataKey] }), {
      id,
      name,
      first_name,
      last_name,
      title,
      display_name,
      gender,
      sex
    });

  return sortedRow;
};

export const debounce = (func: (args?: any) => any, delay: number) => {
  let inDebounce;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  };
};
