/**
 * @copyright 2015, Prometheus Research, LLC
 */

import moment    from 'moment';
import invariant from 'invariant';
import {isArray, toSnakeCase} from '../lang';

export function generateSchemaFromFields(fields) {
  let schema = {
    type: 'object',
    properties: {},
    required: []
  };
  fields = _removeLayout(fields);
  for (let i = 0; i < fields.length; i++) {
    let field = fields[i];
    _growSchema(schema, _toKeyPath(field.valueKey), _fieldToSchema(field));
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
    return moment(value, DATE_ISO_FORMAT, true);
  }
}

function _fieldToSchema(field) {
  switch (field.type) {
  case 'fieldset':
    let schema = generateSchemaFromFields(field.fields);
    schema.isRequired = !!field.required;
    return schema;
  case 'list':
    return {
      type: 'array',
      items: generateSchemaFromFields(field.fields),
      minItems: field.required ? 1 : 0,
      uniqueBy: field.uniqueBy,
      uniqueByError: field.uniqueByError,
      format: Validation.array,
    };
  case 'date':
    return {
      type: 'string',
      format: Validation.date,
      datetimeFormat: field.format,
      minDate: _dateConstraint(field.minDate),
      maxDate: _dateConstraint(field.maxDate),
      isRequired: !!field.required
    };
  case 'datetime':
    return {
      type: 'string',
      format: Validation.datetime,
      datetimeFormat: field.format,
      isRequired: !!field.required
    };
  case 'bool':
    return {
      type: 'boolean',
      format: Validation.bool,
      isRequired: false
    };
  case 'file':
    return {
      type: 'string',
      format: Validation.file,
      isRequired: !!field.required
    };
  case 'enum':
    return {
      type: 'string',
      format: Validation.enum,
      isRequired: !!field.required
    };
  case 'entity':
    return {
      type: 'string',
      format: Validation.entity,
      isRequired: !!field.required
    };
  case 'integer':
    return {
      type: 'integer',
      format: Validation.integer,
      isRequired: !!field.required
    };
  case 'number':
    return {
      type: 'number',
      format: Validation.number,
      isRequired: !!field.required
    };
  case 'string':
  default:
    return {
      type: 'string',
      format: Validation.string,
      formatPattern: field.pattern,
      formatError: field.error,
      isRequired: !!field.required
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

function _growSchema(schema, keyPath, grow) {
  if (keyPath.length === 0) {
    if (schema && schema.type === 'object') {
      return _mergeObjectSchema(schema, grow);
    } else if (schema && schema.type === 'array') {
      return _mergeArraySchema(schema, grow);
    } else {
      return _mergeScalarSchema(schema, grow);
    }
  }
  let key = keyPath.shift();
  if (schema) {
    invariant(
      schema.type === 'object',
      'Schema should be an object schema'
    );
  } else {
    schema = {type: 'object', properties: {}, required: []};
  }
  schema.properties[key] = _growSchema(schema.properties[key], keyPath, grow);
  if (schema.properties[key].isRequired) {
    schema.required = schema.required || [];
    schema.required.push(key);
  }
  return schema;
}

function _toKeyPath(keyPath) {
  if (isArray(keyPath)) {
    return keyPath.slice(0);
  } else {
    return keyPath.split('.').filter(Boolean);
  }
}

let DATETIME_ISO_FORMAT = 'YYYY-MM-DD HH:mm:ss';
let DATE_ISO_FORMAT = 'YYYY-MM-DD';

export let Validation = {
  string(value, node) {
    if (node.formatPattern) {
      if (new RegExp(node.formatPattern).exec(value) === null) {
        return node.formatError || 'does not match the pattern';
      }
    }
    return true;
  },

  datetime(value, node) {
    let date = moment(value, DATETIME_ISO_FORMAT, true);
    if (!date.isValid()) {
      date = moment(value, DATE_ISO_FORMAT, true);
      if (date.isValid()) {
        return true;
      } else {
        return `should be in ${node.datetimeFormat} format`;
      }
    } else {
      return true;
    }
  },

  date(value, node) {
    let date = moment(value, DATE_ISO_FORMAT, true);
    if (!date.isValid()) {
      return `should be in ${node.datetimeFormat} format`;
    }
    if (node.maxDate && date.isAfter(node.maxDate)) {
      return `should not be after ${node.maxDate.format(node.datetimeFormat)}`;
    }
    if (node.minDate && date.isBefore(node.minDate)) {
      return `should not be before ${node.minDate.format(node.datetimeFormat)}`;
    }
    return true;
  },

  array(value, node) {
    if (node.uniqueBy) {
      let uniqueBy = toSnakeCase(node.uniqueBy);
      let seen = {};
      for (let i = 0; i < value.length; i++) {
        let item = value[i];
        if (item == null) {
          continue;
        }
        let key = item[uniqueBy];
        seen[key] = (seen[key] || 0) + 1;
        if (seen[key] > 1) {
          return node.uniqueByError || `"${uniqueBy}" field is not unique`;
        }
      }
    }
    return true;
  },
};
