/**
 * @copyright 2015, Prometheus Research, LLC
 */

import isArray from './isArray';

/**
 * Get value by ``keyPath`` within the ``obj``.
 */
export default function getByKeyPath(obj, keyPath) {
  if (!isArray(keyPath)) {
    keyPath = keyPath.split('.').filter(Boolean);
  }
  for (let i = 0, len = keyPath.length; i < len; i++) {
    if (obj == null) {
      return obj;
    }
    obj = obj[keyPath[i]];
  }
  return obj;
}
