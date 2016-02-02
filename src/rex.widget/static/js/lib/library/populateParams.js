/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as KeyPath from '../KeyPath';

export default function populateParams(params, context) {
  let nextParams = {};
  for (let key in params) {
    if (!params.hasOwnProperty(key)) {
      continue;
    }
    let param = params[key];
    let value;
    if (param.contextRef) {
      value = KeyPath.get(param.contextRef, context);
    } else {
      value = param.value;
    }
    if (value == null) {
      return null;
    }
    nextParams[key] = value;
  }
  return nextParams;
}
