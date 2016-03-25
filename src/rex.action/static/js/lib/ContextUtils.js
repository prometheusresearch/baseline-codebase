/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {isEntity} from './Entity';

export function getMaskedContext(context, inputType) {
  let maskedContext = {};
  for (let key in context) {
    if (
      inputType.rows[key] !== undefined &&
      context[key] != null
    ) {
      maskedContext[key] = context[key];
    }
  }
  return maskedContext;
}

export function contextToParams(context, inputType, options = {}) {
  let params = {};
  for (let key in inputType.rows) {
    if (inputType.rows.hasOwnProperty(key)) {
      let value = context[key];
      params[options.query ? key : (':' + key)] = isEntity(value) ?
        value.id :
        value;
    }
  }
  return params;
}
