/**
 * @copyright 2015, Prometheus Research, LLC
 */

import valueOf from './valueOf';

export default function shallowEquals(a, b) {
  if (a === b) {
    return true;
  }

  if (a == null && b != null || a != null && b == null) {
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
    if (valueOf(a[key]) !== valueOf(b[key])) {
      return false;
    }
  }
  return true;
}
