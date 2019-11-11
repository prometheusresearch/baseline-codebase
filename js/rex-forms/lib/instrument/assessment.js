/**
 * @flow
 * @copyright 2016-present, Prometheus Research, LLC
 */

import isArray from "lodash/isArray";
import isPlainObject from "lodash/isPlainObject";
import moment from "moment";
import type { RIOSInstrument } from "../types.js";
import type { ConfigMap } from "../form/FormFormatConfig";

import { resolveType } from "./schema";

// TODO: Wrong types
type ValueObject =
  | string
  | number
  | Array<ValueObject>
  | { value: string | number }
  | { [key: string]: ValueObject };

type ValueCollection = {
  [key: string]: ValueObject
};

type Assessment = {
  instrument: {
    id: string,
    version: string
  },
  values: ValueCollection,
  meta?: {
    [key: string]: any
  }
};

function coerceEmptyValueToNull(value): null | Object {
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

type Result = {| value: ?string, explanation?: any, annotation?: any |};

function replaceDateToISO(
  value: ?string,
  eventKey: string[],
  formatConfig: ConfigMap
) {
  /**
   * ConfigMap keys are "path.to.folded.value"
   */
  let keyString = eventKey.join(".");
  let valueConfig = formatConfig.get(keyString);

  if (valueConfig == null || value == null) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  let updatedValue = value;

  switch (valueConfig.type) {
    case "datePicker": {
      if (updatedValue.match(valueConfig.dateRegex)) {
        const momentObj = moment(updatedValue, valueConfig.dateFormat);
        if (!momentObj.isValid()) {
          break;
        }
        updatedValue = momentObj.format(valueConfig.DEFAULT_DATE_FORMAT);
      }
      break;
    }

    case "dateTime": {
      if (updatedValue.match(valueConfig.dateTimeRegex)) {
        const momentObj = moment(updatedValue, valueConfig.dateTimeFormat);
        if (!momentObj.isValid()) {
          break;
        }
        updatedValue = momentObj.format(valueConfig.DEFAULT_DATETIME_FORMAT);
      }
      break;
    }
    default: {
    }
  }

  return updatedValue;
}

export const replaceISOtoLocale = (value: ValueCollection): ValueCollection => {
  return value;
};

function makeAssessmentValue(
  value,
  eventKey: string[],
  formatConfig: ConfigMap
) {
  let result: Result = {
    value: null
  };
  if (value) {
    result.value = coerceEmptyValueToNull(value.value);

    // Replace values from locale ones (if used) to ISO date/dateTime
    result.value = replaceDateToISO(value.value, eventKey, formatConfig);
  }
  if (value && value.explanation) {
    result.explanation = value.explanation;
  }
  if (value && value.annotation) {
    result.annotation = value.annotation;
  }
  return result;
}

function makeAssessmentRecord(
  value,
  types,
  record = [],
  valueOverlay,
  eventKey: string[],
  formatConfig: ConfigMap
) {
  let values = {};

  for (let i = 0, len = record.length; i < len; i++) {
    let recordId = record[i].id;
    let fieldType = resolveType(record[i].type, types);
    let updatedEventKey = [...eventKey, recordId];

    if (valueOverlay[recordId]) {
      // If we're overriding this field, just take the override.
      values[recordId] = valueOverlay[recordId];
    } else if (fieldType.base === "recordList") {
      // If this is a record list, clean up the value, then clean up each of
      // the subrecords.
      values[recordId] = makeAssessmentValue(
        value[recordId],
        updatedEventKey,
        formatConfig
      );
      if (values[recordId].value) {
        values[recordId].value = values[recordId].value
          .map(rec => {
            return makeAssessmentRecord(
              rec,
              types,
              fieldType.record,
              valueOverlay,
              updatedEventKey,
              formatConfig
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
      values[recordId] = makeAssessmentValue(
        value[recordId],
        updatedEventKey,
        formatConfig
      );
      values[recordId].value = values[recordId].value || {};

      let rows = fieldType.rows || [];
      rows.forEach(row => {
        if (!values[recordId].value[row.id]) {
          values[recordId].value[row.id] = {};
        }

        let columns = fieldType.columns || [];
        columns.forEach(column => {
          let columnEventKey = [...updatedEventKey, row.id, column.id];

          values[recordId].value[row.id][column.id] = makeAssessmentValue(
            values[recordId].value[row.id][column.id],
            columnEventKey,
            formatConfig
          );
        });
      });
    } else {
      // Otherwise, just clean up the value.
      values[recordId] = makeAssessmentValue(
        value[recordId],
        updatedEventKey,
        formatConfig
      );
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
  value: Object,
  instrument: RIOSInstrument,
  valueOverlay: Object = {},
  meta: { formatConfig: ?ConfigMap } = {}
) {
  let values = makeAssessmentRecord(
    value,
    instrument.types,
    instrument.record,
    valueOverlay,
    [],
    meta.formatConfig || new Map()
  );

  let assessment: Assessment = {
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
