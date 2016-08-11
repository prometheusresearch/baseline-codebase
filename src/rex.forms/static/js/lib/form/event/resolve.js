/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import REXL from 'rex-expression';
import {Schema} from 'react-forms/reactive';
import invariant from 'invariant';
import isArray from 'lodash/isArray';
import some from 'lodash/some';

const INSTRUMENT_REXL_TYPE_MAP = {
  'float': REXL.Number,
  'integer': REXL.Number,
  'text': REXL.String,
  'enumeration': REXL.String,
  'boolean': REXL.Boolean,
  'date': REXL.Date,
  'time': REXL.Time,
  'dateTime': REXL.DateTime,
  'enumerationSet': REXL.List,
  'recordList': REXL.List
};

export default function resolve(
  identifier: string,
  schema: mixed,
  value: mixed,
  parameters: Object = {}
) {
  // See if it's a Field in our Form.
  let result = resolveField(identifier, schema, value);

  if (result === undefined) {
    // It's not a field, let's see if it's a Parameter in the Form.
    result = resolveParameter(identifier, parameters);
  }

  return result;
}

/**
 * Resolve identifier against form value.
 */
function resolveField(identifier, schema, value) {
  if (!isArray(identifier)) {
    identifier = [identifier.toString()];
  }

  for (let i = 0; i < identifier.length; i++) {

    // only check for scoped identifiers if we are within some field
    if (schema &&
        schema.instrument &&
        schema.instrument.type) {

      let instrumentType = schema.instrument.type;

      if (
        instrumentType.base === 'enumerationSet'
      ) {
        // The parent token was an enumerationSet, so treat this token as
        // an attempt to access one of the enumerations.

        // If the token is an enumeration, return true/false indicating
        // whether or not it was selected.
        if (identifier[i] in instrumentType.enumerations) {
          let choices = value || [];
          return REXL.Boolean.value(
            choices.indexOf(identifier[i]) > -1
          );
        }

        // It's not an enumeration.
        return undefined;

      } else if (
        schema.instrument.context === 'recordList' &&
        instrumentType.base === 'recordList'
      ) {
        // The parent token was a recordList, so look for this token as a
        // sub-field and return a List of this field's value across all
        // records.

        if (value != null && !isArray(value)) {
          value = [value];
        }

        if (value == null || value.length === 0) {
          // No records in this recordList.
          return REXL.List.value(null);
        }

        if (!some(instrumentType.record, field => field.id === identifier[i])) {
          // No sub-field exists by this name.
          return REXL.List.value(null);
        }

        value = value.map(item => {
          let value = item[identifier[i]];
          return value == undefined ? null : value.value;
        });

        return convertInstrumentValueToREXL(value, instrumentType);
      }
    }

    schema = selectSchema(schema, identifier[i]);

    if (schema != null) {
      value = selectValue(value, identifier[i]);

      if (schema.instrument && schema.instrument.context === 'field') {
        schema = selectSchema(schema, 'value');
        value = selectValue(value, 'value');
      }
    } else {
      // Token doesn't exist.
      return undefined;
    }
  }

  if (schema.instrument && schema.instrument.type) {
    if (schema.instrument.type.base  === 'recordList') {
      // Not a fully addressed field.
      return undefined;
    }

    return convertInstrumentValueToREXL(value, schema.instrument.type);
  } else {
    // Not a fully-addressed field.
    return undefined;
  }
}

/**
 * Resolve identifier against parameters.
 */
function resolveParameter(identifier, parameters) {
  let name;
  if (isArray(identifier)) {
    name = identifier.join('.');
  } else {
    name = identifier.toString();
  }

  if (name in parameters) {
    let value = parameters[name];
    if (value === undefined) {
      value = null;
    }

    return convertValueToREXL(value);
  }

  return undefined;
}

/**
 * Lift value into REXL by using instrument type as a witness.
 */
function convertInstrumentValueToREXL(value, instrumentType) {
  let type = INSTRUMENT_REXL_TYPE_MAP[instrumentType.base];

  if (type === undefined) {
    return REXL.Untyped.value(null);
  } else if (type === REXL.List && value !== null) {
    value = value.map(convertValueToREXL);
    if (value.length === 0) {
      value = null;
    }
  }

  return type.value(value);
}

/**
 * Lift value into REXL.
 */
function convertValueToREXL(value) {
  let type = REXL.Untyped;

  if (typeof value === 'string') {
    type = REXL.String;
  } else if (typeof value === 'number') {
    type = REXL.Number;
  } else if (typeof value === 'boolean') {
    type = REXL.Boolean;
  } else if (value instanceof Date) {
    type = REXL.DateTime;
  }

  return type.value(value);
}


function selectSchema(schema, key) {
  try {
    return Schema.select(schema, [key]);
  } catch (err) {
    return undefined;
  }
}

function selectValue(value, key) {
  invariant(
    value == null || typeof value === 'object',
    'Expected an object'
  );
  return value ? value[key] : null;
}
