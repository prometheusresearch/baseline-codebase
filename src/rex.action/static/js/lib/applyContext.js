/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {isEntity} from './Entity';

export default function applyContext(producible, input, context, options = {}) {
  let params = {};
  for (let key in input.rows) {
    if (input.rows.hasOwnProperty(key)) {
      let value = context[key];
      params[options.query ? key : (':' + key)] = isEntity(value) ? value.id : value;
    }
  }
  return producible.params(params);
}
