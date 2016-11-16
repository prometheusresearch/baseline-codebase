/**
 * @flow
 */

import type {Query} from '../Query';
import type {KeyPath} from '../QueryPointer';

import * as q from '../Query';

export type Transform
  = {type: 'replace'; value: Query}
  | {type: 'cut'}
  | {type: 'insertAfter'; value: Query}
  | {type: 'insertBefore'; value: Query};

export default function transformAtKeyPath(
  obj: Object,
  keyPath: KeyPath,
  value: Transform
): ?Object {
  if (keyPath.length === 0) {
    if (value.type === 'cut') {
      return q.here;
    } else {
      return value.value;
    }
  }
  let [key, ...ks] = keyPath;
  let updatedValue = transformAtKeyPath(obj[key], ks, value);
  if (Array.isArray(obj)) {
    let arr = obj.slice(0);
    if (ks.length === 0 && value.type === 'insertAfter') {
      arr.splice(key + 1, 0, updatedValue);
    } else if (ks.length === 0 && value.type === 'insertBefore') {
      arr.splice(key, 0, updatedValue);
    } else if (ks.length === 0 && value.type === 'cut') {
      arr = arr.slice(0, key);
    } else if (updatedValue != null) {
      arr.splice(key, 1, updatedValue);
    } else {
      arr.splice(key, 1);
    }
    return arr;
  } else {
    return {
      ...obj,
      [key]: updatedValue
    };
  }
}
