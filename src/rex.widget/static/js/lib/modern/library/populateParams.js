/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

function populateParams(params, context) {
  var nextParams = {};
  for (var key in params) {
    var param = params[key];
    var value;
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
  for (var i = 0; i < keyPath.length; i++) {
    if (!obj) {
      return obj;
    }
    obj = obj[keyPath[i]];
  }
  return obj;
}

module.exports = populateParams;
