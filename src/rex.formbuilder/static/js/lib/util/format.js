/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';


var format = function (text, variables) {
  variables = variables || {};

  return text.replace(/(?:\$\{(\w+)\})/g, function (match, name) {
    var replacement = variables[name];

    if ((replacement === undefined) || (replacement === null)) {
      return '';
    }

    return replacement;
  });
};


module.exports = format;

