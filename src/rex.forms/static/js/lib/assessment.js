/**
 * Utilities for working with assessments.
 *
 * @jsx React.DOM
 */
'use strict';

var utils = require('./utils');


function coerceEmptyValueToNull(value) {
  if (value === undefined
      || value === ''
      || (utils.isObject(value) && Object.getOwnPropertyNames(value).length === 0)
      || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  if (utils.isObject(value)) {
    Object.getOwnPropertyNames(value).forEach((property) => {
      value[property] = coerceEmptyValueToNull(value[property]);
    });

  } else if (Array.isArray(value)) {
    value = value.map((val) => {
      return coerceEmptyValueToNull(val);
    }).filter((v) => {
      return (v !== null);
    });

    if (value.length === 0) {
      return null;
    }
  }

  return value;
}

function makeAssessmentValue(value) {
  var result = {value: null};
  if (value) {
    result.value = coerceEmptyValueToNull(value.value);
  }
  if (value && value.explanation) {
    result.explanation = value.explanation;
  }
  if (value && value.annotation) {
    result.annotation = value.annotation;
  }
  return result;
}

/**
 * Make an assessment object from a current form value and a corresponding
 * instrument
 *
 * @param {Object} value
 * @param {Instrument} instrument
 * @returns {Assessment}
 */
function makeAssessment(value, instrument, valueOverlay) {
  var values = {};

  for (var i = 0, len = instrument.record.length; i < len; i++) {
    var recordId = instrument.record[i].id;
    if (valueOverlay[recordId]) {
      values[recordId] = valueOverlay[recordId];
    } else {
      values[recordId] = makeAssessmentValue(value[recordId]);
    }
  }

  return {
    instrument: {
      id: instrument.id,
      version: instrument.version
    },
    values: values
  };
}

module.exports = {
  makeAssessment
};
