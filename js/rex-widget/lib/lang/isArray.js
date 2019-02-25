/**
 * @copyright 2015, Prometheus Research, LLC
 */

let toString = Object.prototype.toString;
const ARRAY_REP = '[object Array]';

export default function isArray(o) {
  return toString.call(o) === ARRAY_REP;
}
