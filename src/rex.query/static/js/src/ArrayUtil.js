/**
 * @flow
 */

export type KeyPath = Array<number | string>;

function referenceEquals(a, b) {
  return a === b;
}

export function equals<A, B>(
  a: Array<A>,
  b: Array<B>,
  equals: (a: A, b: B) => boolean = referenceEquals,
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!equals(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

export function traceEquals(a: Array<KeyPath>, b: Array<KeyPath>) {
  return equals(a, b, equals);
}

export function findIndexRight<T>(
  array: Array<T>,
  predicate: (item: T, index: number) => boolean,
): number {
  if (array.length === 0) {
    return -1;
  }
  for (let i = array.length - 1; i > -1; i--) {
    if (predicate(array[i], i)) {
      return i;
    }
  }
  return -1;
}

export function transformLast<A>(array: Array<A>, fn: (a: A) => A): Array<A> {
  if (array.length === 0) {
    return array;
  } else {
    array = array.slice();
    array.push(fn(array.pop()));
    return array;
  }
}

export function sum(array: Array<number>): number {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += array[i];
  }
  return sum;
}

export function max(array: Array<number>): number {
  return Math.max(...array);
}

export function transpose(obj: Object, keyPath: Array<string>): Array<Object> {
  if (keyPath.length > 0) {
    let [key, ...nextKeyPath] = keyPath;
    if (obj[key] != null && obj[key].length > 0) {
      let result = [];
      for (let index = 0; index < obj[key].length; index++) {
        if (nextKeyPath.length > 0) {
          let nextObj = transpose(obj[key][index], nextKeyPath);
          for (let nextIndex = 0; nextIndex < nextObj.length; nextIndex++) {
            result.push({
              ...obj,
              __index__: index,
              [key]: nextObj[nextIndex],
            });
          }
        } else {
          result.push({
            ...obj,
            __index__: index,
            [key]: obj[key][index],
          });
        }
      }
      return result;
    } else {
      return [
        {
          ...obj,
          __index__: 0,
          [key]: {},
        },
      ];
    }
  } else {
    return [obj];
  }
}
