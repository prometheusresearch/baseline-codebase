/**
 * @copyright 2015, Prometheus Research, LLC
 */

export default function createEntity(type, id, props) {
  return {
    'meta:type': type,
    id,
    ...props
  };
}
