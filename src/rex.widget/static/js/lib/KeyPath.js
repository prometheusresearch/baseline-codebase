/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {isArray} from './lang';

export function get(keyPath, obj) {
  keyPath = normalize(keyPath);
  for (let i = 0, len = keyPath.length; i < len; i++) {
    if (obj == null) {
      return obj;
    }
    obj = obj[keyPath[i]];
  }
  return obj;
}

export function equals(a, b) {
  a = normalize(a);
  b = normalize(b);
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] != b[i]) {
      return false;
    }
  }
  return true;
}

export function normalize(keyPath) {
  if (keyPath === null) {
    return [];
  }
  if (!isArray(keyPath)) {
    keyPath = keyPath.split('.').filter(Boolean);
  }
  return keyPath;
}
