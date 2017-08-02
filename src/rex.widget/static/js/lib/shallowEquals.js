/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import valueOf from './valueOf';

const isArray = Array.isArray;

export function shallowEquals(a: mixed, b: mixed) {
  return shallowEqualsWith(a, b, referenceValueOfEquality);
}

function referenceValueOfEquality(a, b) {
  return valueOf(a) === valueOf(b);
}

/**
 * Same as `shallowEquals` but also shallowly traverses deep into arrays.
 *
 * This is useful for query params (which might have arrays as values).
 */
export function shallowParamsEquals(a: mixed, b: mixed) {
  return shallowEqualsWith(a, b, paramEquality);
}

function paramEquality(a, b) {
  if (isArray(a)) {
    if (!isArray(b)) {
      return false;
    }
    const aLength = a.length;
    if (aLength !== b.length) {
      return false;
    }
    for (let i = 0; i < aLength; i++) {
      if (!referenceValueOfEquality(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  return referenceValueOfEquality(a, b);
}

function shallowEqualsWith(a: any, b: any, eq) {
  if (a === b) {
    return true;
  }

  if ((a == null && b != null) || (a != null && b == null)) {
    return false;
  }

  if (a == null && b == a) {
    return true;
  }

  let keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    if (!eq(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

export default shallowEquals;
