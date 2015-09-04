/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';


var SIMPLE_INSTRUMENT_BASE_TYPES = [
  'float',
  'integer',
  'text',
  'enumeration',
  'enumerationSet',
  'boolean',
  'date',
  'time',
  'dateTime'
];

var COMPLEX_INSTRUMENT_BASE_TYPES = [
  'recordList',
  'matrix'
];

var INSTRUMENT_BASE_TYPES = SIMPLE_INSTRUMENT_BASE_TYPES.concat(
  COMPLEX_INSTRUMENT_BASE_TYPES
);


module.exports = {
  SIMPLE_INSTRUMENT_BASE_TYPES,
  COMPLEX_INSTRUMENT_BASE_TYPES,
  INSTRUMENT_BASE_TYPES
};

