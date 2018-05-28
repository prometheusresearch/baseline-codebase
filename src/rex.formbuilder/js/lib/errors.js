/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';


function makeError(name, inherits) {
  var error = function (message) {
    this.name = name;
    this.message = message;
  };

  inherits = inherits || Error;

  error.prototype = Object.create(inherits.prototype);
  error.prototype.constructor = error;

  return error;
}


var FormBuilderError = makeError('FormBuilderError');

var ConfigurationError = makeError(
  'ConfigurationError',
  FormBuilderError
);

var UnsupportedConfigurationError = makeError(
  'UnsupportedConfigurationError',
  ConfigurationError
);

var ParsingError = makeError(
  'ParsingError',
  FormBuilderError
);


module.exports = {
  FormBuilderError,
  ConfigurationError,
  UnsupportedConfigurationError,
  ParsingError
};

