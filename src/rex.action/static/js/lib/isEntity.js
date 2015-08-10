/**
 * @copyright 2015, Prometheus Research, LLC
 */

export default function isEntity(obj) {
  return obj && obj['meta:type'];
}
