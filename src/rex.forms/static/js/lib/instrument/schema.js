/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import Validate, {isEmptyValue} from './validate';

type JSONSchema = {};

/**
 * Generate JSON schema for assessment document from instrument.
 */
export function fromInstrument(instrument, env): JSONSchema {
  env = {
    ...env,
    types: instrument.types,
    validate: new Validate({i18n: env.i18n}),
  };
  let schema = {
    ...generateRecordSchema(instrument.record, 'instrument', [], env),
    format(value, schema) {
      let errorList = [];
      if (schema.event) {
        errorList = schema.event.validate(value);
      }
      return errorList.length === 0 ? true : errorList;
    }
  };
  return schema;
}

function generateRecordSchema(record, context, eventKey, env) {
  let properties = {};
  for (let i = 0; i < record.length; i++) {
    let field = record[i];
    properties[field.id] = generateFieldSchema(field, eventKey, env);
  }
  return {
    type: 'object',
    properties: properties,
    instrument: {
      context,
      type: {
        base: 'recordList',
        record,
      },
    },
  };
}

function generateFieldSchema(field, eventKey, env): JSONSchema {

  eventKey = eventKey.concat(field.id);

  let annotationNeeded = (
    !field.required &&
    field.annotation &&
    field.annotation !== 'none'
  );

  let explanationNeeded = (
    field.explanation &&
    field.explanation !== 'none'
  );

  let explanationRequired = field.explanation === 'required';

  let annotationRequired = (
    annotationNeeded &&
    field.annotation === 'required'
  );

  let type = resolveType(field.type, env.types);

  let schema = {
    type: 'object',
    properties: {},
    form: {
      eventKey: eventKey.join('.'),
    },
    instrument: {
      context: 'field',
      field,
      type,
    },
    format(value, _node) {
      if (annotationRequired) {
        if (
          isEmptyValue(value.value) &&
          isEmptyValue(value.annotation)
        ) {
          return {
            field: 'annotation',
            message: env.i18n.gettext('You must provide a response for this field.')
          };
        }
      }
      return true;
    },
    onUpdate(value, {key}) {
      if (key === 'value' && !isEmptyValue(value)) {
        value = {...value, annotation: null};
      }
      return value;
    }
  };

  if (annotationNeeded) {
    schema.properties.annotation = {type: 'string'};
  }

  if (explanationNeeded) {
    schema.properties.explanation = {type: 'string'};
  }

  if (explanationRequired) {
    schema.required = schema.required || [];
    schema.required.push('explanation');
  }

  schema.properties.value = generateValueSchema(type, eventKey, env);
  if (field.required && (['recordList', 'matrix'].indexOf(type.base) < 0)) {
    schema.required = schema.required || [];
    schema.required.push('value');
  }
  schema.properties.value.instrument.required = field.required;

  return schema;
}

export function generateValueSchema(type, eventKey, env) {
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
      return {
        type: 'array',
        items: generateRecordSchema(type.record, 'recordListRecord', eventKey, env),
        format: env.validate.recordList,
        instrument: {
          type,
          context: 'recordList'
        }
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
        properties[row.id] = generateMatrixRowSchema(row, type.columns, eventKey, env);
      });
      return {
        type: 'object',
        format: env.validate.matrix,
        instrument: {
          type,
          context: 'matrix',
        },
        properties,
      };
    }
    default:
      throw new Error('unknown type: ' + JSON.stringify(type));
  }
}

function generateMatrixRowSchema(row, columns, eventKey, env) {
  eventKey = eventKey.concat(row.id);
  let node = {
    type: 'object',
    format: env.validate.matrixRow,
    properties: {},
    required: [],
    instrument: {
      ...row,
      context: 'matrixRow',
      required: row.required,
      requiredColumns: []
    }
  };
  columns.forEach(column => {
    node.properties[column.id] = generateMatrixColumnSchema(column, eventKey, env);
    if (column.required) {
      node.instrument.requiredColumns.push(column.id);
    }
  });
  return node;
}

function generateMatrixColumnSchema(column, eventKey, env) {
  column = {
    ...column,
    required: false
  };
  return generateFieldSchema(column, eventKey, env);
}

/**
 * Returns true for types which can be described by only their names.
 */
function isSimpleFieldType(type) {
  return (
       type === 'float'
    || type === 'integer'
    || type === 'text'
    || type === 'boolean'
    || type === 'date'
    || type === 'time'
    || type === 'dateTime'
  );
}

/**
 * Returns true for base types.
 */
function isBaseFieldType(type) {
  return (
    isSimpleFieldType(type)
    || type === 'enumeration'
    || type === 'enumerationSet'
    || type === 'matrix'
    || type === 'recordList'
  );
}

/**
 * Resolve type using the type collection.
 *
 * @returns A constained type representation.
 */
export function resolveType(type, types, asBase: boolean = false) {
  if (isSimpleFieldType(type)) {
    return {base: type};
  } else if (asBase && isBaseFieldType(type)) {
    return {base: type};
  } else if (typeof type === 'string') {
    return resolveType(types[type], types);
  } else {
    let resolvedType = resolveType(type.base, types, true);
    return {
      ...resolvedType,
      ...type,
      base: resolvedType.base,
    };
  }
}
