/**
 * @copyright 2015, Prometheus Research, LLC
 */

/**
 * A safe way to call `.valueOf()`.
 *
 * Accepts `undefined` and `null` as well.
 */
export default function valueOf(obj) {
  if (obj && obj.valueOf) {
    return obj.valueOf();
  } else {
    return obj;
  }
}
