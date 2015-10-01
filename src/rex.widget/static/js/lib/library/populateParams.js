/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

function populateParams(params, context) {
  let nextParams = {};
  for (let key in params) {
    if (!params.hasOwnProperty(key)) {
      continue;
    }
    let param = params[key];
    let value;
    if (param.contextRef) {
      value = getByKeyPath(context, param.contextRef);
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

function getByKeyPath(obj, keyPath) {
  for (let i = 0; i < keyPath.length; i++) {
    if (!obj) {
      return obj;
    }
    obj = obj[keyPath[i]];
  }
  return obj;
}

module.exports = populateParams;
