/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as KeyPath from './KeyPath';

/**
 * Get value by ``keyPath`` within the ``obj``.
 */
export default function getByKeyPath(obj, keyPath) {
  return KeyPath.get(keyPath, obj);
}
