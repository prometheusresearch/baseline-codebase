/**
 * @copyright 2015, Prometheus Research, LLC
 */

import moment from 'moment';
import invariant from 'invariant';
import * as KeyPath from '../KeyPath';
import * as Validation from './Validation';

export function fromFields(fields) {
  let schema = {
    type: 'object',
    properties: {},
    required: [],
  };
  fields = _removeLayout(fields);
  schema = _growSchemaWithFields(schema, fields);
  schema = _aggregateSchema(schema);
  return schema;
}

function _prefixHideIfItem(item, key) {
  return {
    ...item,
    keyPathPattern: [key].concat(item.keyPathPattern),
  };
}

function _aggregateSchema(schema, keyPath = []) {
  schema.hideIfList = [];

  if (schema.type === 'object') {
    let keys = Object.keys(schema.properties);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let prop = schema.properties[key];
      _aggregateSchema(prop, keyPath.concat(key));
      schema.hideIfList = schema.hideIfList.concat(
        prop.hideIfList.map(item => _prefixHideIfItem(item, key)));

    }
  } else if (schema.type === 'array') {
    _aggregateSchema(schema.items);
    schema.hideIfList = schema.hideIfList.concat(
      schema.items.hideIfList.map(item => _prefixHideIfItem(item, '*')));
  }

  if (schema.hideIf) {
    schema.hideIfList.push({hideIf: schema.hideIf, keyPathPattern: []});
  }

  return schema;
}

function _removeLayout(fields) {
  let noLayout = [];
  for (let i = 0; i < fields.length; i++) {
    let field = fields[i];
    if (field.type && field.props) {
      noLayout = noLayout.concat(_removeLayout(field.props.fields));
    } else {
      if (field.type === 'fieldset' || field.type === 'list') {
        field = {...field, fields: _removeLayout(field.fields)};
      }
      noLayout.push(field);
    }
  }
  return noLayout;
}

function _dateConstraint(value) {
  if (!value) {
    return undefined;
  }
  switch(value) {
    case 'today':
      return moment(); // .startOf('day');
    case 'tomorrow':
      return moment().add(1, 'day');
    case 'yesterday':
      return moment().subtract(1, 'day');
    default:
      return moment(value, Validation.DATE_ISO_FORMAT, true);
  }
}

function _fieldToSchema(field) {
  let defaultAttributes = {
    hideIf: field.hideIf,
  };
  switch (field.type) {
    case 'fieldset': {
      let schema = {
        type: 'object',
        properties: {},
        required: [],
      };
      schema = _growSchemaWithFields(schema, field.fields);
      schema.isRequired = !!field.required;
      return schema;
    }
    case 'list': {
      let schema = {
        ...defaultAttributes,
        type: 'array',
        items: {
          type: 'object',
          properties: {},
          required: [],
        },
        minItems: field.required ? 1 : 0,
        uniqueBy: field.uniqueBy,
        uniqueByError: field.uniqueByError,
        format: Validation.array,
      };
      schema.items = _growSchemaWithFields(schema.items, field.fields);
      schema.isRequired = !!field.required;
      return schema;
    }
    case 'date':
      return {
        ...defaultAttributes,
        type: 'string',
        format: Validation.date,
        datetimeFormat: field.format,
        minDate: _dateConstraint(field.minDate),
        maxDate: _dateConstraint(field.maxDate),
        isRequired: !!field.required
      };
    case 'datetime':
      return {
        ...defaultAttributes,
        type: 'string',
        format: Validation.datetime,
        datetimeFormat: field.format,
        isRequired: !!field.required
      };
    case 'bool':
      return {
        ...defaultAttributes,
        type: 'boolean',
        format: Validation.bool,
        isRequired: false
      };
    case 'file':
      return {
        ...defaultAttributes,
        type: 'string',
        format: Validation.file,
        isRequired: !!field.required
      };
    case 'enum':
      return {
        ...defaultAttributes,
        type: 'string',
        format: Validation.enumeration,
        isRequired: !!field.required
      };
    case 'entity':
      return {
        ...defaultAttributes,
        type: 'string',
        format: Validation.entity,
        isRequired: !!field.required
      };
    case 'entity-list':
      return {
        ...defaultAttributes,
        type: 'array',
        items: {type: 'any'},
        minItems: field.minItems !== undefined ? field.minItems : field.required ? 1 : 0,
        maxItems: field.maxItems,
      };
    case 'integer':
      return {
        ...defaultAttributes,
        type: 'integer',
        format: Validation.integer,
        isRequired: !!field.required
      };
    case 'number':
      return {
        ...defaultAttributes,
        type: 'number',
        format: Validation.number,
        isRequired: !!field.required
      };
    case 'string':
      return {
        ...defaultAttributes,
        type: 'string',
        format: Validation.string,
        formatPattern: field.pattern,
        formatError: field.error,
        isRequired: !!field.required
      };
    case 'json':
      return {
        ...defaultAttributes,
        type: 'any',
        format: Validation.json,
        formatError: field.error,
        isRequired: !!field.required
      };
    default:
      return {
        ...defaultAttributes,
        type: 'any',
        isRequired: !!field.required,
      };
  }
}

function _mergeObjectSchema(a, b) {
  invariant(
    a.type === 'object' && b.type === 'object',
    'Both schemas should be object schemas'
  );
  return {
    ...a, ...b,
    properties: {...a.properties, ...b.properties},
    required: _mergeRequired(a.required, b.required)
  };
}

function _mergeArraySchema(a, b) {
  return {
    ...a, ...b,
    items: {...a.items, ...b.items}
  };
}

function _mergeScalarSchema(a, b) {
  return {...a, ...b};
}

function _mergeRequired(a, b) {
  let merged = [];
  for (let i = 0; i < a.length; i++) {
    merged.push(a[i]);
  }
  for (let i = 0; i < b.length; i++) {
    if (merged.indexOf(b[i]) === -1) {
      merged.push(b[i]);
    }
  }
  return merged;
}

function _growSchemaWithFields(schema, fields) {
  for (let i = 0; i < fields.length; i++) {
    let field = fields[i];
    let localKeyPath = KeyPath.normalize(field.valueKey);
    _growSchemaWithField(
      schema,
      localKeyPath.slice(0),
      _fieldToSchema(field, localKeyPath)
    );
  }
  return schema;
}

function _growSchemaWithField(schema, keyPath, grow) {
  if (keyPath.length === 0) {
    if (schema && schema.type === 'object') {
      return _mergeObjectSchema(schema, grow);
    } else if (schema && schema.type === 'array') {
      return _mergeArraySchema(schema, grow);
    } else {
      return _mergeScalarSchema(schema, grow);
    }
  } else {
    keyPath = keyPath.slice(0);
    let key = keyPath.shift();
    if (isNumeric(key)) {
      if (schema) {
        invariant(
          schema.type === 'array',
          'Schema should be an array schema'
        );
      } else {
        schema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {},
            required: []
          }
        };
      }
      _growSchemaWithField(schema.items, keyPath, grow);
    } else {
      if (schema) {
        invariant(
          schema.type === 'object',
          'Schema should be an object schema'
        );
      } else {
        schema = {
          type: 'object',
          properties: {},
          required: []
        };
      }
      schema.properties[key] = _growSchemaWithField(
        schema.properties[key],
        keyPath,
        grow
      );
      if (schema.properties[key].isRequired) {
        schema.required = schema.required || [];
        schema.required.push(key);
      }
    }
    return schema;
  }
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
