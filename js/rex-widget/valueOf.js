/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

/**
 * A safe way to call `.valueOf()`.
 *
 * Accepts `undefined` and `null` as well.
 */
export default function valueOf(obj: any): any {
  if (obj && obj.valueOf) {
    return obj.valueOf();
  } else {
    return obj;
  }
}
