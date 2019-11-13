/**
 * @flow
 * @copyright 2016-present, Prometheus Research, LLC
 */

import isArray from "lodash/isArray";
import isPlainObject from "lodash/isPlainObject";
import moment from "moment";
import type {
  RIOSInstrument,
  RIOSField,
  RIOSRecord,
  RIOSAssessment,
  RIOSValueCollection,
  RIOSValueObject,
  RIOSValue,
  RIOSExtendedType
} from "../types.js";
import * as FormFormatConfig from "../form/FormFormatConfig";

import { resolveType } from "./schema";

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

function localeFormatToFormat(
  value: string,
  fieldType: RIOSExtendedType,
  format: FormFormatConfig.FieldConfig
) {
  switch (fieldType.base) {
    case "date": {
      if (value.match(format.dateRegex)) {
        const date = moment(value, format.dateFormat);
        if (!date.isValid()) {
          return value;
        }
        return date.format(format.DEFAULT_DATE_FORMAT);
      } else {
        return value;
      }
    }
    case "dateTime": {
      if (value.match(format.dateTimeRegex)) {
        const date = moment(value, format.dateTimeFormat);
        if (!date.isValid()) {
          return value;
        }
        return date.format(format.DEFAULT_DATETIME_FORMAT);
      } else {
        return value;
      }
    }
    default: {
      return value;
    }
  }
}

function formatToLocaleFormat(
  value: string,
  fieldType: RIOSExtendedType,
  format: FormFormatConfig.FieldConfig
) {
  switch (fieldType.base) {
    case "date": {
      if (value.match(format.dateRegex)) {
        const date = moment(value, format.dateFormat);
        if (!date.isValid()) {
          return value;
        }
        return date.format(format.DEFAULT_DATE_FORMAT);
      } else {
        return value;
      }
    }

    case "dateTime": {
      if (value.match(format.dateTimeRegex)) {
        const date = moment(value, format.dateTimeFormat);
        if (!date.isValid()) {
          return value;
        }
        return date.format(format.DEFAULT_DATETIME_FORMAT);
      } else {
        return value;
      }
    }
    default: {
      return value;
    }
  }
}

function makeAssessmentValue(
  value,
  key: string[],
  fieldType: RIOSExtendedType,
  formatConfig: FormFormatConfig.Config
) {
  let result: RIOSValueObject = {
    value: null
  };
  if (value) {
    result.value = coerceEmptyValueToNull(value.value);

    // Replace values from locale ones (if used) to ISO date/dateTime
    let format = FormFormatConfig.findFieldConfig(formatConfig, key);
    if (format != null && result.value != null) {
      result.value = localeFormatToFormat(value.value, fieldType, format);
    }
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
  key: string[],
  formatConfig: FormFormatConfig.Config
) {
  let values = {};

  for (let i = 0, len = record.length; i < len; i++) {
    let recordId = record[i].id;
    let fieldType = resolveType(record[i].type, types);
    let updatedEventKey = [...key, recordId];

    if (valueOverlay[recordId]) {
      // If we're overriding this field, just take the override.
      values[recordId] = valueOverlay[recordId];
    } else if (fieldType.base === "recordList") {
      // If this is a record list, clean up the value, then clean up each of
      // the subrecords.
      values[recordId] = makeAssessmentValue(
        value[recordId],
        updatedEventKey,
        fieldType,
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
        fieldType,
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
            resolveType(column.type, types),
            formatConfig
          );
        });
      });
    } else {
      // Otherwise, just clean up the value.
      values[recordId] = makeAssessmentValue(
        value[recordId],
        updatedEventKey,
        fieldType,
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
  meta: { formatConfig: ?FormFormatConfig.Config } = {}
) {
  let values = makeAssessmentRecord(
    value,
    instrument.types,
    instrument.record,
    valueOverlay,
    [],
    meta.formatConfig || FormFormatConfig.makeEmpty()
  );

  let assessment: RIOSAssessment = {
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

/**
 * Map RIOSValueCollection by applying a mapper function to all scalar fields
 * (all non martrix and non recordList fields).
 */
export let mapValueCollection = (
  instrument: RIOSInstrument,
  values: RIOSValueCollection,
  mapper: (RIOSValue, RIOSField, RIOSExtendedType, string[]) => RIOSValue
): RIOSValueCollection => {
  function makeValue(value: ?RIOSValue, field: RIOSField, key: string[]) {
    let fieldType = resolveType(field.type, instrument.types);
    switch (fieldType.base) {
      case "recordList": {
        let record = fieldType.record;
        if (record != null && value != null && Array.isArray(value)) {
          let nextValue = [];
          for (let item of value) {
            if (typeof item !== "string") {
              nextValue.push(makeValueCollection(item, record, key));
            }
          }
          return nextValue;
        } else {
          return value;
        }
      }
      case "matrix": {
        let rows = fieldType.rows;
        let columns = fieldType.columns;
        if (
          rows != null &&
          columns != null &&
          value != null &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          let nextValues = {};
          for (let rowId in value) {
            let rowValues = value[rowId];
            if (rowValues == null) {
              nextValues[rowId] = rowValues;
              continue;
            }
            let record: RIOSRecord = columns.map(col => ({
              id: col.id,
              description: col.description,
              type: col.type,
              identifiable: col.identifiable,
              required: col.required
            }));
            let nextRowValues = makeValueCollection(rowValues, record, [
              ...key,
              rowId
            ]);
            nextValues[rowId] = nextRowValues;
          }
          return nextValues;
        } else {
          return value;
        }
      }
      default: {
        if (value != null) {
          return mapper(value, field, fieldType, key);
        } else {
          return value;
        }
      }
    }
  }

  function makeValueCollection(
    values: RIOSValueCollection,
    record: RIOSRecord,
    key: string[]
  ): RIOSValueCollection {
    let nextValues = {};
    for (let fieldId in values) {
      let value = values[fieldId];
      let field = record.find(field => field.id === fieldId);
      nextValues[fieldId] = {
        ...value,
        value:
          field != null
            ? makeValue(value.value, field, [...key, field.id])
            : value.value
      };
    }
    return nextValues;
  }

  return makeValueCollection(values, instrument.record, []);
};

export function makeInitialValue(
  instrument: RIOSInstrument,
  values: RIOSValueCollection,
  formatConfig: FormFormatConfig.Config
): RIOSValueCollection {
  return mapValueCollection(instrument, values, (value, field, type, key) => {
    let format = FormFormatConfig.findFieldConfig(formatConfig, key);
    if (format != null && typeof value === "string") {
      return formatToLocaleFormat(value, type, format);
    } else {
      return value;
    }
  });
}
