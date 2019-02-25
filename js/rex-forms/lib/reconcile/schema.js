/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import mapValues from 'lodash/mapValues';
import map from 'lodash/map';
import keys from 'lodash/keys';
import uniq from 'lodash/uniq';

import {resolveType} from '../instrument/schema';
import Validate from '../instrument/validate';
import {isEmptyValue} from '../instrument/validate';


export function fromDiscrepancies(discrepancies = {}, instrument, form, env) {
  env = {
    ...env,
    validate: new Validate({i18n: env.i18n}),
    types: instrument.types,
  };
  let required = [];
  let properties = mapValues(discrepancies, (discrepancy, fieldId) => {
    let field = findField(instrument, fieldId);
    let {question, position} = findPageQuestion(form, fieldId);
    let type = resolveType(field.type, env.types);
    if (field.required) {
      required.push(fieldId);
    }
    return {
      ...generateValueSchema(type, question, discrepancy, env),
      discrepancy,
      form: {question, position},
      instrument: {field, type},
    };
  });
  let schema = {
    type: 'object',
    properties,
    required,
  };
  return schema;
}

function generateValueSchema(type, question, discrepancy, env) {
  switch (type.base) {
    case 'float':
      return {
        type: 'any',
        format: env.validate.number,
        instrument: {type},
      };
    case 'integer':
      return {
        type: 'any',
        format: env.validate.integer,
        instrument: {type},
      };
    case 'text':
      return {
        type: 'string',
        format: env.validate.text,
        instrument: {type},
      };
    case 'boolean':
      return {
        type: 'boolean',
        instrument: {type},
      };
    case 'date':
      return {
        type: 'string',
        format: env.validate.date,
        instrument: {type},
      };
    case 'time':
      return {
        type: 'string',
        format: env.validate.time,
        instrument: {type},
      };
    case 'dateTime':
      return {
        type: 'string',
        format: env.validate.dateTime,
        instrument: {type},
      };
    case 'recordList':
      let items = [];
      let maxIndex = Math.max.apply(null, Object.keys(discrepancy).map(Number));
      for (let i = 0; i <= maxIndex; i++) {
        items.push(
          generateRecordSchema(type.record, question, discrepancy[i] || {}, env)
        );
      }
      return {
        type: 'array',
        items,
        instrument: {type},
      };
    case 'enumeration':
      return {
        enum: Object.keys(type.enumerations),
        instrument: {type},
      };
    case 'enumerationSet':
      return {
        type: 'array',
        format: env.validate.enumerationSet,
        instrument: {type},
        items: {enum: Object.keys(type.enumerations)}
      };
    case 'matrix': {
      let properties = {};
      type.rows.forEach(row => {
        if (!discrepancy[row.id]) {
          return;
        }
        properties[row.id] = generateMatrixRowSchema(
          row,
          type.columns,
          question,
          discrepancy[row.id],
          env
        );
      });
      return {
        type: 'object',
        instrument: {type},
        properties,
      };
    }
    default:
      throw new Error('unknown type: ' + JSON.stringify(type));
  }
}


function recordValidator(needsValue, value, node) {
  if (needsValue) {
    if (isEmptyValue(value)) {
      return 'At least one field in this record must have a value.';
    }
  }

  return true;
}

function generateRecordSchema(record, question, discrepancy, env) {
  let properties = {};
  let required = [];
  for (let i = 0; i < record.length; i++) {
    let field = record[i];
    if (!discrepancy[field.id]) {
      continue;
    }
    let recordQuestion = findQuestion(question, field.id);
    let type = resolveType(field.type, env.types);
    if (field.required) {
      required.push(field.id);
    }
    properties[field.id] = {
      ...generateValueSchema(type, recordQuestion, discrepancy, env),
      form: {question: recordQuestion.question},
      instrument: {field, type},
    };
  }
  return {
    type: 'object',
    properties: properties,
    required: required,
    format: recordValidator.bind(null, !!discrepancy._NEEDS_VALUE_),
    instrument: {
      type: {
        base: 'recordList',
        record,
      },
    },
  };
}


function generateMatrixRowSchema(row, columns, question, discrepancy, env) {
  let node = {
    type: 'object',
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
      question,
      discrepancy[column.id],
      env
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

function generateMatrixColumnSchema(column, row, question, discrepancy, env) {
  let columnQuestion = findQuestion(question, column.id);
  let rowQuestion = findRow(question, row.id);
  let type = resolveType(column.type, env.types);
  return {
    ...generateValueSchema(type, columnQuestion, discrepancy, env),
    instrument: {type, field: column, row},
    form: {
      ...columnQuestion,
      row: rowQuestion,
    }
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

function findPageQuestion(form, fieldId) {
  for (let i = 0; i < form.pages.length; i++) {
    let page = form.pages[i];
    for (let j = 0; j < page.elements.length; j++) {
      let element = page.elements[j];
      if (element.type !== 'question') {
        continue;
      }
      if (element.options.fieldId !== fieldId) {
        continue;
      }
      let question = element.options || {};
      return {
        question,
        position: {
          id: fieldId,
          pageNumber: i,
          elementNumber: j,
          elementCount: page.elements.length,
        }
      };
    }
  }

  return {
    question: {
      fieldId,
      text: fieldId,
    },
    position: null,
  };
}

function findQuestion(question, fieldId) {
  for (let i = 0; i < question.questions.length; i++) {
    let recordQuestion = question.questions[i];
    if (recordQuestion.fieldId !== fieldId) {
      continue;
    }
    return {question: recordQuestion};
  }

  return {
    question: {fieldId, text: fieldId}
  };
}

function findRow(question, rowId) {
  for (let i = 0; i < question.rows.length; i++) {
    let row = question.rows[i];
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
