/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import isArray from "lodash/isArray";
import isPlainObject from "lodash/isPlainObject";
import moment from "moment";

import { resolveType } from "./schema";

function coerceEmptyValueToNull(value) {
  if (
    value === undefined ||
    value === "" ||
    (isPlainObject(value) && Object.keys(value).length === 0) ||
    (isArray(value) && value.length === 0)
  ) {
    return null;
  }

  let result;

  if (isPlainObject(value)) {
    result = {};
    Object.keys(value).forEach(key => {
      result[key] = coerceEmptyValueToNull(value[key]);
    });
  } else if (isArray(value)) {
    result = value
      .map(val => {
        return coerceEmptyValueToNull(val);
      })
      .filter(v => {
        return v !== null;
      });

    if (result.length === 0) {
      return null;
    }
  } else {
    result = value;
  }

  return result;
}

function makeAssessmentValue(value) {
  let result = { value: null };
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
  let values = {};

  for (let i = 0, len = record.length; i < len; i++) {
    let recordId = record[i].id;
    let fieldType = resolveType(record[i].type, types);

    if (valueOverlay[recordId]) {
      // If we're overriding this field, just take the override.
      values[recordId] = valueOverlay[recordId];
    } else if (fieldType.base === "recordList") {
      // If this is a record list, clean up the value, then clean up each of
      // the subrecords.
      values[recordId] = makeAssessmentValue(value[recordId]);
      if (values[recordId].value) {
        values[recordId].value = values[recordId].value
          .map(rec => {
            return makeAssessmentRecord(
              rec,
              types,
              fieldType.record,
              valueOverlay
            );
          })
          .filter(rec => {
            return (
              Object.keys(rec).filter(subfield => {
                return !!rec[subfield].value;
              }).length > 0
            );
          });

        if (values[recordId].value.length === 0) {
          values[recordId].value = null;
        }
      }
    } else if (fieldType.base === "matrix") {
      // If this is a matrix, make sure each cell is represented.
      values[recordId] = makeAssessmentValue(value[recordId]);
      values[recordId].value = values[recordId].value || {};

      fieldType.rows.forEach(row => {
        if (!values[recordId].value[row.id]) {
          values[recordId].value[row.id] = {};
        }

        fieldType.columns.forEach(column => {
          values[recordId].value[row.id][column.id] = makeAssessmentValue(
            values[recordId].value[row.id][column.id]
          );
        });
      });
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
export function makeAssessment(
  value,
  instrument,
  valueOverlay = {},
  meta = {}
) {
  let values = makeAssessmentRecord(
    value,
    instrument.types,
    instrument.record,
    valueOverlay
  );

  const { formatConfig } = meta;
  if (formatConfig) {
    for (let key of formatConfig.keys()) {
      const keyValue = values[key] ? values[key].value : null;
      const keyConfig = formatConfig.get(key);

      if (keyValue == null) {
        continue;
      }

      switch (keyConfig.type) {
        case "datePicker": {
          if (keyValue.match(keyConfig.dateRegex)) {
            const momentObj = moment(keyValue, keyConfig.dateFormat);
            if (!momentObj.isValid()) {
              return;
            }

            values[key] = {
              ...values[key],
              value: momentObj.format(keyConfig.DEFAULT_DATE_FORMAT)
            };
          }
          break;
        }
        case "dateTime": {
          if (keyValue.match(keyConfig.dateTimeRegex)) {
            const momentObj = moment(keyValue, keyConfig.dateTimeFormat);
            if (!momentObj.isValid()) {
              return;
            }

            values[key] = {
              ...values[key],
              value: momentObj.format(keyConfig.DEFAULT_DATETIME_FORMAT)
            };
          }
          break;
        }
        default: {
        }
      }
    }
  }

  let assessment = {
    instrument: {
      id: instrument.id,
      version: instrument.version
    },
    values: values
  };

  if (meta) {
    assessment.meta = meta;
  }

  return assessment;
}
