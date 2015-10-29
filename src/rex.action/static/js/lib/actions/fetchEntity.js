/**
 * @copyright 2015, Prometheus Research, LLC
 */

export default function fetchEntity({entity, data, context}) {
  let id = context[entity.name].id;
  return {
    entity: data.port.params({'*': id}).getSingleEntity()
  };
}
