/**
 * @copyright 2015, Prometheus Research, LLC
 */

export default function shallowEquals(a, b) {
  if (a === b) {
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
