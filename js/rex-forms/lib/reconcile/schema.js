/**
 * @copyright 2014-present, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";
import mapValues from "lodash/mapValues";
import map from "lodash/map";
import keys from "lodash/keys";
import uniq from "lodash/uniq";

import { resolveType } from "../instrument/schema";
import Validate from "../instrument/validate";
import { isEmptyValue } from "../instrument/validate";
import * as FormFormatConfig from "../form/FormFormatConfig.js";
import * as types from "../types.js";

export function fromDiscrepancies(
  discrepancies: ?types.DiscrepancySet,
  instrument: types.RIOSInstrument,
  form: types.RIOSForm,
  envConfig: {| i18n: any, formatConfig: FormFormatConfig.Config |},
) {
  if (discrepancies == null) {
    discrepancies = {};
  }
  let env = {
    i18n: envConfig.i18n,
    formatConfig: envConfig.formatConfig,
    validate: new Validate({ i18n: envConfig.i18n }),
    types: instrument.types,
  };
  let required = [];
  let properties = mapValues(discrepancies, (discrepancy, fieldId) => {
    let field = findField(instrument, fieldId);
    invariant(field != null, `Field ${fieldId} does not exist in instrument`);
    let { question, position } = findPageQuestion(form, fieldId);
    let type = resolveType(field.type, env.types);
    if (field.required) {
      required.push(fieldId);
    }
    let key = [fieldId];
    return {
      ...generateValueSchema(type, question, discrepancy, key, env),
      discrepancy,
      form: { question, position },
      instrument: { field, type },
    };
  });
  let schema = {
    type: "object",
    properties,
    required,
  };
  return schema;
}

function generateValueSchema(
  type,
  question: types.RIOSQuestion,
  discrepancy,
  key: string[],
  env,
) {
  switch (type.base) {
    case "float":
      return {
        type: "any",
        format: env.validate.number,
        instrument: { type },
      };
    case "integer":
      return {
        type: "any",
        format: env.validate.integer,
        instrument: { type },
      };
    case "text":
      return {
        type: "string",
        format: env.validate.text,
        instrument: { type },
      };
    case "boolean":
      return {
        type: "boolean",
        instrument: { type },
      };
    case "date": {
      return {
        type: "string",
        format: env.validate.date,
        instrument: { type },
        fieldConfig: FormFormatConfig.findFieldConfig(env.formatConfig, key),
      };
    }
    case "time":
      return {
        type: "string",
        format: env.validate.time,
        instrument: { type },
      };
    case "dateTime":
      return {
        type: "string",
        format: env.validate.dateTime,
        instrument: { type },
        fieldConfig: FormFormatConfig.findFieldConfig(env.formatConfig, key),
      };
    case "recordList": {
      let record = type.record;
      invariant(record != null, 'Missing "record" on recordList type');
      let questions = question.questions;
      invariant(
        questions != null,
        'Missing "questions" on question for recordList type',
      );
      let items = [];
      let maxIndex = Math.max.apply(null, Object.keys(discrepancy).map(Number));
      for (let i = 0; i <= maxIndex; i++) {
        items.push(
          generateRecordListSchema(
            record,
            questions,
            discrepancy[i] || {},
            key,
            env,
          ),
        );
      }
      return {
        type: "array",
        items,
        instrument: { type },
      };
    }
    case "enumeration": {
      let enumerations = type.enumerations;
      invariant(
        enumerations != null,
        'Missing "enumerations" on enumeration type',
      );
      return {
        enum: Object.keys(enumerations),
        instrument: { type },
      };
    }
    case "enumerationSet": {
      let enumerations = type.enumerations;
      invariant(
        enumerations != null,
        'Missing "enumerations" on enumerationSet type',
      );
      return {
        type: "array",
        format: env.validate.enumerationSet,
        instrument: { type },
        items: { enum: Object.keys(enumerations) },
      };
    }
    case "matrix": {
      let rows = type.rows;
      invariant(rows != null, 'Missing "rows" on matrix type');
      let columns = type.columns;
      invariant(columns != null, 'Missing "columns" on matrix type');
      let questions = question.questions;
      invariant(
        questions != null,
        'Missing "questions" on question for matrix type',
      );
      let questionRows = question.rows;
      invariant(
        questionRows != null,
        'Missing "rows" on question for matrix type',
      );

      let properties = {};
      rows.forEach(row => {
        if (!discrepancy[row.id]) {
          return;
        }
        properties[row.id] = generateMatrixRowSchema(
          row,
          columns,
          questions,
          questionRows,
          discrepancy[row.id],
          key,
          env,
        );
      });
      return {
        type: "object",
        instrument: { type },
        properties,
      };
    }
    default:
      throw new Error("unknown type: " + JSON.stringify(type));
  }
}

function recordValidator(needsValue, value, node) {
  if (needsValue) {
    if (isEmptyValue(value)) {
      return "At least one field in this record must have a value.";
    }
  }

  return true;
}

function generateRecordListSchema(record, questions, discrepancy, key, env) {
  let properties = {};
  let required = [];
  for (let i = 0; i < record.length; i++) {
    let field = record[i];
    if (!discrepancy[field.id]) {
      continue;
    }
    let recordQuestion = findQuestion(questions, field.id);
    let type = resolveType(field.type, env.types);
    if (field.required) {
      required.push(field.id);
    }
    let updatedKey = key.concat([field.id]);
    properties[field.id] = {
      ...generateValueSchema(
        type,
        recordQuestion,
        discrepancy,
        updatedKey,
        env,
      ),
      form: { question: recordQuestion },
      instrument: { field, type },
    };
  }
  return {
    type: "object",
    properties: properties,
    required: required,
    format: recordValidator.bind(null, !!discrepancy._NEEDS_VALUE_),
    instrument: {
      type: {
        base: "recordList",
        record,
      },
    },
  };
}

function generateMatrixRowSchema(
  row,
  columns,
  questions,
  questionRows,
  discrepancy,
  key,
  env,
) {
  let node = {
    type: "object",
    properties: {},
    required: [],
  };
  columns.forEach(column => {
    if (!discrepancy[column.id]) {
      return;
    }
    node.properties[column.id] = generateMatrixColumnSchema(
      column,
      row,
      questions,
      questionRows,
      discrepancy[column.id],
      key,
      env,
    );
    if (column.required) {
      node.required.push(column.id);
    }
  });
  if (row.required) {
    node.required = uniq(keys(node.properties).concat(node.required));
  }
  return node;
}

function generateMatrixColumnSchema(
  column,
  row,
  questions,
  questionRows,
  discrepancy,
  key,
  env,
) {
  let columnQuestion = findQuestion(questions, column.id);
  let rowQuestion = findRow(questionRows, row.id);
  let type = resolveType(column.type, env.types);
  let updatedKey = key.concat([row.id, column.id]);
  return {
    ...generateValueSchema(type, columnQuestion, discrepancy, updatedKey, env),
    instrument: { type, field: column, row },
    form: {
      question: columnQuestion,
      row: rowQuestion,
    },
  };
}

function findField(instrument, fieldId) {
  for (let i = 0; i < instrument.record.length; i += 1) {
    if (instrument.record[i].id === fieldId) {
      return instrument.record[i];
    }
  }
  return null;
}

function findPageQuestion(
  form,
  fieldId,
): {|
  question: types.RIOSQuestion,
  position: ?{|
    id: string,
    pageNumber: number,
    elementNumber: number,
    elementCount: number,
  |},
|} {
  for (let i = 0; i < form.pages.length; i++) {
    let page = form.pages[i];
    for (let j = 0; j < page.elements.length; j++) {
      let element = page.elements[j];
      if (element.type !== "question") {
        continue;
      }
      if (element.options.fieldId !== fieldId) {
        continue;
      }
      let question: types.RIOSQuestion = element.options || ({}: any);
      return {
        question,
        position: {
          id: fieldId,
          pageNumber: i,
          elementNumber: j,
          elementCount: page.elements.length,
        },
      };
    }
  }

  return {
    question: {
      fieldId,
      text: { en: fieldId },
    },
    position: null,
  };
}

function findQuestion(
  questions: types.RIOSQuestion[],
  fieldId,
): types.RIOSQuestion {
  for (let i = 0; i < questions.length; i++) {
    let recordQuestion = questions[i];
    if (recordQuestion.fieldId !== fieldId) {
      continue;
    }
    return recordQuestion;
  }

  return {
    fieldId,
    text: { en: fieldId },
  };
}

function findRow(rows: types.RIOSDescriptor[], rowId) {
  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];
    if (row.id !== rowId) {
      continue;
    }
    return row;
  }

  return {
    id: rowId,
    text: rowId,
  };
}
