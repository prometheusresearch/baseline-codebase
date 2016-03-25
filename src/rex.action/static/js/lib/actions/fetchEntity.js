/**
 * @copyright 2016, Prometheus Research, LLC
 */

import {contextToParams} from '../ContextUtils';

export default function fetchEntity({entity, data, context, contextTypes}) {
  let id = context[entity.name].id;
  data = data.params({'*': id}).getSingleEntity();
  data = data.params(contextToParams(context, contextTypes.input));
  return {entity: data};
}
