/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var isEmpty = require('./isEmpty');


var isEmptyLocalization = function (obj) {
  if (isEmpty(obj)) {
    return true;
  }

  if ((typeof obj === 'object')
      && (Object.getOwnPropertyNames(obj).length > 0)) {

    var populatedKeys = Object.getOwnPropertyNames(obj).filter((key) => {
      return !isEmpty(obj[key]);
    });

    return (populatedKeys.length === 0);
  }

  return false;
};


module.exports = isEmptyLocalization;

