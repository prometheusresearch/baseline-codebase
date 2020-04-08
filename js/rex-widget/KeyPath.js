/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

export type key = string | number;
export type keypath = null | key | $ReadOnlyArray<key>;
export opaque type data: mixed = Object;

export function get(keyPathP: keypath, obj: data) {
  let keyPath = normalize(keyPathP);
  for (let i = 0, len = keyPath.length; i < len; i++) {
    if (obj == null) {
      return obj;
    }
    obj = obj[keyPath[i]];
  }
  return obj;
}

export function equals(ak: keypath, bk: keypath) {
  let a = normalize(ak);
  let b = normalize(bk);
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    // $FlowFixMe: ...
    if (a[i] != b[i]) {
      return false;
    }
  }
  return true;
}

export function normalize(keyPath: keypath): key[] {
  if (keyPath === null) {
    return [];
  }
  if (Array.isArray(keyPath)) {
    return keyPath.slice();
  } else if (typeof keyPath === "number") {
    return [keyPath];
  } else {
    // $FlowFixMe: ...
    return keyPath.split(".").filter(Boolean);
  }
}

export function toReactKey(keypath: void | keypath) {
  if (keypath == null) {
    return "";
  } else if (Array.isArray(keypath)) {
    return keypath.join("--");
  } else {
    return keypath;
  }
}
