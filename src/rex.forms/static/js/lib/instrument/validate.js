/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import isInteger from 'lodash/isInteger';
import isFinite from 'lodash/isFinite';
import isPlainObject from 'lodash/isPlainObject';

const DATE_TIME_RE = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d$/;
const DATE_RE = /^\d\d\d\d-\d\d-\d\d$/;
const TIME_RE = /^\d\d:\d\d:\d\d$/;

/**
* Determine if field value is empty.
*/
export function isEmptyValue(value) {
  if (Array.isArray(value)) {
    // If the array is empty, or only contains "empty" values, then true.
    return value.filter((val) => {
      return !isEmptyValue(val);
    }).length === 0;

  } else if (isPlainObject(value)) {
    // If the object is empty, or only contains keys with "empty" values, then true.
    return Object.keys(value).filter((key) => {
      return !isEmptyValue(value[key]);
    }).length === 0;

  } else {
    // These are what we define as "empty" values.
    return value === null || value === '' || value === undefined;
  }
}

/**
* Determine if field value is completed.
*/
export function isFieldCompleted(formValue) {
  let {value, completeErrorList} = formValue;
  return (
    completeErrorList.length === 0 &&
    value && (
      !isEmptyValue(value.value) ||
      !isEmptyValue(value.annotation)
    )
  );
}

export function createReactFormsMessages({i18n}) {
  return {
    IS_REQUIRED: i18n.gettext('You must provide a response for this field.'),

    // These aren't used, don't bother translating them.
    DOES_NOT_CONFORM_TO_FORMAT: 'does not conform to: ',
    INVALID: 'invalid',
    IS_THE_WRONG_TYPE: 'is the wrong type',
    MUST_BE_UNIQUE: 'must be unique',
    HAS_ADDITIONAL_ITEMS: 'has additional items',
    HAS_ADDITIONAL_PROPERTIES: 'has additional properties',
    MUST_BE_AN_ENUM_VALUE: 'must be an enum value',
    DEPENDENCIES_NOT_SET: 'dependencies not set',
    REFERENCED_SCHEMA_DOES_NOT_MATCH: 'referenced schema does not match',
    NEGATIVE_SCHEMA_MATCHES: 'negative schema matches',
    PATTERN_MISMATCH: 'pattern mismatch',
    NO_SCHEMAS_MATCH: 'no schemas match',
    NO_OR_MORE_THAN_ONE_SCHEMAS_MATCH: 'no (or more than one) schemas match',
    HAS_A_REMAINDER: 'has a remainder',
    HAS_MORE_PROPERTIES_THAN_ALLOWED: 'has more properties than allowed',
    HAS_LESS_PROPERTIES_THAN_ALLOWED: 'has less properties than allowed',
    HAS_MORE_ITEMS_THAN_ALLOWED: 'has more items than allowed',
    HAS_LESS_ITEMS_THAN_ALLOWED: 'has less items than allowed',
    HAS_LONGER_LENGTH_THAN_ALLOWED: 'has longer length than allowed',
    HAS_LESS_LENGTH_THAN_ALLOWED: 'has less length than allowed',
    IS_LESS_THAN_MINIMUM: 'is less than minimum',
    IS_MORE_THAN_MAXIMUM: 'is more than maximum',
  };
}

export default class Validate {

  constructor({i18n}) {
    this.i18n = i18n;
  }

  number = (value, node) => {
    if (!isFinite(value)) {
      return this.i18n.gettext('Not a valid number.');
    }
    if (node.instrument.type.range) {
      let failure = this.checkValueRange(value, node.instrument.type.range);
      if (failure !== true) {
        return failure;
      }
    }
    return true;
  };

  integer = (value, node) => {
    if (!isInteger(value)) {
      return this.i18n.gettext('Not a valid whole number.');
    }
    if (node.instrument.type.range) {
      let failure = this.checkValueRange(value, node.instrument.type.range);
      if (failure !== true) {
        return failure;
      }
    }
    return true;
  };

  date = (value, node) => {
    if (!DATE_RE.exec(value)) {
      return this.i18n.gettext('This must be entered in the form: YYYY-MM-DD');
    }
    if (!this.checkLegalDate(value)) {
      return this.i18n.gettext('Not a valid date.');
    }

    if (node.instrument.type.range) {
      let failure = this.checkValueRange(value, node.instrument.type.range);
      if (failure !== true) {
        return failure;
      }
    }
    return true;
  };

  dateTime = (value, node) => {
    if (!DATE_TIME_RE.exec(value)) {
      return this.i18n.gettext('This must be entered in the form: YYYY-MM-DDTHH:MM:SS');
    }

    let parts = value.split('T');
    if (!this.checkLegalDate(parts[0])) {
      return this.i18n.gettext('Not a valid date.');
    }
    if (!this.checkLegalTime(parts[1])) {
      return this.i18n.gettext('Not a valid time.');
    }

    if (node.instrument.type.range) {
      let failure = this.checkValueRange(value, node.instrument.type.range);
      if (failure !== true) {
        return failure;
      }
    }
    return true;
  };

  time = (value, node) => {
    if (!TIME_RE.exec(value)) {
      return this.i18n.gettext('This must be entered in the form: HH:MM:SS');
    }
    if (!this.checkLegalTime(value)) {
      return this.i18n.gettext('Not a valid time.');
    }

    if (node.instrument.type.range) {
      let failure = this.checkValueRange(value, node.instrument.type.range);
      if (failure !== true) {
        return failure;
      }
    }
    return true;
  };

  recordList = (value, node) => {
    value = value || [];

    if (value.length > 0) {
      let errors = [];
      value.forEach((rec, idx) => {
        if (isEmptyValue(rec)) {
          errors.push({
            field: '' + idx,
            message: this.i18n.gettext('You must response to at least one question in this record.')
          });
        }
      });
      if (errors.length > 0) {
        return errors;
      }
    }

    if (isEmptyValue(value)) {
      if (node.instrument.required) {
        return this.i18n.gettext('You must provide a response for this field.');
      }
    } else {
      if (node.instrument.type.length) {
        let {min, max} = node.instrument.type.length;
        let minFailure = (
          min !== undefined &&
          min > value.length
        );
        let maxFailure = (
          max !== undefined &&
          max < value.length
        );
        if (minFailure || maxFailure) {
          let error = {force: true};
          if (min !== undefined && max !== undefined) {
            error.message = this.i18n.gettext('Must enter between %(min)s and %(max)s records.', {min, max});
          } else if (min !== undefined) {
            error.message = this.i18n.gettext('Must enter at least %(min)s records.', {min});
          } else if (max !== undefined) {
            error.message = this.i18n.gettext('Cannot enter more than %(max)s records.', {max});
          }
          return error;
        }
      }
    }
    return true;
  };

  matrix = (value, node) => {
    if (isEmptyValue(value)) {
      if (node.instrument.required) {
        return this.i18n.gettext('You must provide a response for this field.');
      }
    }
    return true;
  };

  matrixRow = (value, node) => {
    if (isEmptyValue(value)) {
      if (node.instrument.required) {
        return this.i18n.gettext('You must provide a response for this row.');
      }
    } else {
      let errorList = node.instrument.requiredColumns.filter((col) => {
        return isEmptyValue(value[col]);
      }).map((col) => {
        let error = {
          field: col + '.value',
          message: this.i18n.gettext('You must provide a response for this field.'),
          force: true,
        };
        return error;
      });
      return errorList.length === 0 ? true : errorList;
    }
    return true;
  };

  enumerationSet = (value, node) => {
    value = value || [];
    if ((value.length > 0) && node.instrument.type.length) {
      let {min, max} = node.instrument.type.length;
      let minFailure = (
        min !== undefined &&
        min > value.length
      );
      let maxFailure = (
        max !== undefined &&
        max < value.length
      );
      if (minFailure || maxFailure) {
        if (min !== undefined && max !== undefined) {
          return this.i18n.gettext('Must select between %(min)s and %(max)s choices.', {min, max});
        } else if (min !== undefined) {
          return this.i18n.gettext('Must select at least %(min)s choices.', {min});
        } else if (max !== undefined) {
          return this.i18n.gettext('Cannot select more than %(max)s choices.', {max});
        }
      }
    }
    return true;
  };

  text = (value, node) => {
    value = value || '';
    if (node.instrument.type.length) {
      let {min, max} = node.instrument.type.length;
      let minFailure = (
        min !== undefined &&
        min > value.length
      );
      let maxFailure = (
        max !== undefined &&
        max < value.length
      );
      if (minFailure || maxFailure) {
        if (min !== undefined && max !== undefined) {
          return this.i18n.gettext('Must be between %(min)s and %(max)s characters.', {min, max});
        } else if (min !== undefined) {
          return this.i18n.gettext('Must be at least %(min)s characters.', {min});
        } else if (max !== undefined) {
          return this.i18n.gettext('Cannot be more than %(max)s characters.', {max});
        }
      }
    }
    if (node.instrument.type.pattern) {
      if (!(node.instrument.type.pattern instanceof RegExp)) {
        // XXX: We mutate field object here, is it safe?
        node.instrument.type.pattern = new RegExp(node.instrument.type.pattern);
      }
      if (!node.instrument.type.pattern.exec(value)) {
        return this.i18n.gettext('Does not match the expected pattern.');
      }
    }
    return true;
  };

  checkValueRange(value, {min, max}) {
    let minFailure = (
      min !== undefined &&
      min > value
    );
    let maxFailure = (
      max !== undefined &&
      max < value
    );
    if (minFailure || maxFailure) {
      if (min !== undefined && max !== undefined) {
        return this.i18n.gettext('Must be between %(min)s and %(max)s.', {min, max});
      } else if (min !== undefined) {
        return this.i18n.gettext('Must be at least %(min)s.', {min});
      } else if (max !== undefined) {
        return this.i18n.gettext('Cannot be beyond %(max)s.', {max});
      }
    } else {
      return true;
    }
  }

  checkLegalDate(dateStr) {
    let parts = dateStr.split('-').map(Number);
    let parsed = new Date(parts);
    if (
        isNaN(parsed.getTime())
        || (parsed.getFullYear() !== parts[0])
        || (parsed.getMonth() !== (parts[1] - 1))
        || (parsed.getDate() !== parts[2])
        ) {
      return false;
    }
    return true;
  }

  checkLegalTime(timeStr) {
    let parts = timeStr.split(':').map(Number);
    if (
      ((parts[0] < 0) || (parts[0] > 23))
      || ((parts[1] < 0) || (parts[1] > 59))
      || ((parts[2] < 0) || (parts[2] > 59))
      ) {
      return false;
    }
    return true;
  }

}

