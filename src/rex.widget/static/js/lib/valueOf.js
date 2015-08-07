/**
 * @copyright 2015, Prometheus Research, LLC
 */

export default function valueOf(obj) {
  if (obj && obj.valueOf) {
    return obj.valueOf();
  } else {
    return obj;
  }
}
