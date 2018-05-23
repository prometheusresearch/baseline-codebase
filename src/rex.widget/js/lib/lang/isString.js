/**
 * @copyright 2015, Prometheus Research, LLC
 */

let toString = Object.prototype.toString;
const STRING_REP = '[object String]';

export default function isString(o) {
  return toString.call(o) === STRING_REP;
}
