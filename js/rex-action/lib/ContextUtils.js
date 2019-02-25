/**
 * @copyright 2015-flow, Prometheus Research, LLC
 * @flow
 */

import type {Context, Entity, RecordType} from './model/types';
import {isEntity} from './model/Entity';

export function getMaskedContext(context: Context, inputType: RecordType): Context {
  let maskedContext = {};
  for (let key in context) {
    if (inputType.rows[key] !== undefined && context[key] != null) {
      maskedContext[key] = context[key];
    }
  }
  return maskedContext;
}

export function contextToParams(
  context: Context,
  inputType: RecordType,
  options: {query?: boolean} = {},
): Object {
  let params = {};
  for (let key in inputType.rows) {
    if (inputType.rows.hasOwnProperty(key)) {
      let value = context[key];
      if (isEntity(value)) {
        const entity: Entity = (value: any);
        params[options.query ? key : ':' + key] = entity.id;
      } else {
        params[options.query ? key : ':' + key] = value;
      }
    }
  }
  return params;
}
