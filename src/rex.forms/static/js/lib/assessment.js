/**
 * Utilities for working with assessments.
 *
 * @jsx React.DOM
 */
'use strict';

var utils = require('./utils');
var instrumentSchema = require('./createSchema');


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


function makeAssessmentRecord(value, types, record, valueOverlay) {
  var values = {};
  var typeCatalog = instrumentSchema.createTypeCatalog(types);

  for (var i = 0, len = record.length; i < len; i++) {
    var recordId = record[i].id;
    var fieldType = instrumentSchema.getTypeDefinition(
      record[i].type,
      typeCatalog
    );

    if (valueOverlay[recordId]) {
      // If we're overriding this field, just take the override.
      values[recordId] = valueOverlay[recordId];

    } else if (fieldType.rootType === 'recordList') {
      // If this is a record list, clean up the value, then clean up each of
      // the subrecords.
      values[recordId] = makeAssessmentValue(value[recordId]);
      if (values[recordId].value) {
        values[recordId].value = values[recordId].value.map((rec) => {
          return makeAssessmentRecord(
            rec,
            types,
            fieldType.record,
            valueOverlay
          );
        });
      }

    } else {
      // Otherwise, just clean up the value.
      values[recordId] = makeAssessmentValue(value[recordId]);
    }
  }

  return values;
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
  var values = makeAssessmentRecord(
    value,
    instrument.types,
    instrument.record,
    valueOverlay
  );

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

