/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';


var isEmpty = function (obj) {
  if ((obj === null) || (obj === undefined) || (obj === '')) {
    return true;
  }

  if (Array.isArray(obj)) {
    return (obj.length === 0);
  }

  if (obj instanceof Date) {
    return false;
  }

  if ((typeof obj === 'object')
      && (Object.getOwnPropertyNames(obj).length === 0)) {
    return true;
  }

  return false;
};


module.exports = isEmpty;

