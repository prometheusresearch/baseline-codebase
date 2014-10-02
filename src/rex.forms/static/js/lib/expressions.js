'use strict';


var REXL = require('rex-expression');


var INSTRUMENT_REXL_TYPE_MAP = {
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


class Resolver {
  constructor(schema, value, parameters) {
    this.schema = schema;
    this.value = value;
    this.parameters = parameters || {};
  }

  resolveIdentifier(identifier) {
    var value;

    // See if it's a Field in our Form.
    value = this.resolveField(identifier);

    if (value === undefined) {
      // It's not a field, let's see if it's a Parameter in the Form.
      value = this.resolveParameter(identifier);
    }

    if (value === undefined) {
      // It's not an identifier we recognize, default to NULL.
      value = REXL.Untyped.value(null);
    }

    return value;
  }

  resolveField(identifier) {
    if (!Array.isArray(identifier)) {
      identifier = [identifier.toString()];
    }

    var value = this.value;
    var schema = this.schema;

    for (var i = 0; i < identifier.length; i++) {
      var instrumentType = schema.props.instrumentType;

      if (instrumentType) {
        if (instrumentType.rootType === 'enumerationSet') {
          // The parent token was an enumerationSet, so treat this token as
          // an attempt to access one of the enumerations.

          // If the token is an enumeration, return true/false indicating
          // whether or not it was selected.
          if (identifier[i] in instrumentType.enumerations) {
            var choices = value || [];
            return REXL.Boolean.value(
              choices.indexOf(identifier[i]) > -1
            );
          }

          // It's not an enumeration.
          return undefined;

        } else if (instrumentType.rootType === 'recordList') {
          // The parent token was a recordList, so look for this token as a
          // sub-field and return a List of this field's value across all
          // records.

          if ((value === null) || (value.length === 0)) {
            // No records in this recordList.
            return REXL.List.value(null);
          }

          var subField = instrumentType.record.filter((field) => {
            return (field.id === identifier[i]);
          });
          if (subField.length === 0) {
            // No sub-field exists by this name.
            return REXL.List.value(null);
          }

          var ret = [];
          for (var r = 0; r < value.length; r++) {
            var v = value[r][identifier[i]];
            if (v === undefined) {
              v = null;
            } else {
              v = v.value;
            }

            ret.push(v);
          }

          return this.convertInstrumentValueToRexl(
            instrumentType,
            ret
          );
        }
      }

      value = value[identifier[i]];

      if (value !== undefined) {
        schema = schema.get(identifier[i]);

        if (schema.props.isQuestion) {
          value = value.value;
          schema = schema.get('value');
        }
      } else {
        // Token doesn't exist.
        return undefined;
      }
    }

    if (schema.props.instrumentType) {
      if (schema.props.instrumentType.rootType === 'recordList') {
        // Not a fully addressed field.
        return undefined;
      }

      return this.convertInstrumentValueToRexl(
        schema.props.instrumentType,
        value
      );
    } else {
      // Not a fully-addressed field.
      return undefined;
    }
  }

  resolveParameter(identifier) {
    var name;
    if (Array.isArray(identifier)) {
      name = identifier.join('.');
    } else {
      name = identifier.toString();
    }

    if (name in this.parameters) {
      var value = this.parameters[name];
      if (value === undefined) {
        value = null;
      }

      return this.convertValueToRexl(value);
    }

    return undefined;
  }

  convertInstrumentValueToRexl(instrumentType, value) {
    var type = INSTRUMENT_REXL_TYPE_MAP[instrumentType.rootType];

    if (type === undefined) {
      return REXL.Untyped.value(null);
    } else if ((type === REXL.List) && (value !== null)) {
      var ret = Array(value.length);
      for (var i = 0; i < ret.length; i++) {
        ret[i] = this.convertValueToRexl(value[i]);
      }
      value = ret.length > 0 ? ret : null;
    }

    return type.value(value);
  }

  convertValueToRexl(value) {
    var type = REXL.Untyped;

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
}


module.exports = {
  Resolver
};

