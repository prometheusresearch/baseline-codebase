/**
 * @copyright 2015, Prometheus Research, LLC
 */

import applyContext from '../applyContext';

export default function fetchEntity({entity, data, context, contextTypes}) {
  let id = context[entity.name].id;
  data = data.port.params({'*': id}).getSingleEntity();
  data = applyContext(data, contextTypes.input, context);
  return {entity: data};
}
