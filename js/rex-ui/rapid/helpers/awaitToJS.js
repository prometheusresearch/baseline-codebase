/**
 * @flow
 */

export function toJS<T, U>(
  promise: Promise<T>
): Promise<[U | null, T | typeof undefined]> {
  return promise
    .then((data: T) => [null, data])
    .catch((err: U) => {
      return [err, undefined];
    });
}
