/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import moment from "moment";
import type { Value, error } from "react-forms";
import type { I18N } from "rex-i18n";
import type { JSONSchemaExt } from "../types";

import invariant from "invariant";
import isInteger from "lodash/isInteger";
import isFinite from "lodash/isFinite";
import isArray from "lodash/isArray";
import isPlainObject from "lodash/isPlainObject";

import cast from "../cast";

/**
 * ISO8601-based default regexps
 */
const DATE_TIME_RE = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d(:\d\d)?$/;
const DATE_RE = /^\d\d\d\d-\d\d-\d\d$/;
const TIME_RE = /^\d\d:\d\d(:\d\d)?$/;
const ISO_DATE_FORMAT = "YYYY-MM-DD";

/**
 * Determine if field value is empty.
 */
export function isEmptyValue(value: mixed): boolean {
  if (isArray(value)) {
    const valueRefined: Array<mixed> = cast(value);
    // If the array is empty, or only contains "empty" values, then true.
    return valueRefined.filter(val => !isEmptyValue(val)).length === 0;
  } else if (isPlainObject(value)) {
    const valueRefined: Object = cast(value);
    // If the object is empty, or only contains keys with "empty" values, then true.
    return (
      Object.keys(valueRefined).filter(key => !isEmptyValue(valueRefined[key]))
        .length === 0
    );
  } else {
    // These are what we define as "empty" values.
    return value === null || value === "" || value === undefined;
  }
}

/**
 * Determine if field value is completed.
 */
export function isFieldCompleted(formValue: Value): boolean {
  let { value, completeErrorList } = formValue;
  return !!(
    completeErrorList.length === 0 &&
    value &&
    typeof value === "object" &&
    (!isEmptyValue(value.value) || !isEmptyValue(value.annotation))
  );
}

export function createReactFormsMessages({ i18n }: { i18n: I18N }) {
  return {
    IS_REQUIRED: i18n.gettext("You must provide a response for this field."),

    // These aren't used, don't bother translating them.
    DOES_NOT_CONFORM_TO_FORMAT: "does not conform to: ",
    INVALID: "invalid",
    IS_THE_WRONG_TYPE: "is the wrong type",
    MUST_BE_UNIQUE: "must be unique",
    HAS_ADDITIONAL_ITEMS: "has additional items",
    HAS_ADDITIONAL_PROPERTIES: "has additional properties",
    MUST_BE_AN_ENUM_VALUE: "must be an enum value",
    DEPENDENCIES_NOT_SET: "dependencies not set",
    REFERENCED_SCHEMA_DOES_NOT_MATCH: "referenced schema does not match",
    NEGATIVE_SCHEMA_MATCHES: "negative schema matches",
    PATTERN_MISMATCH: "pattern mismatch",
    NO_SCHEMAS_MATCH: "no schemas match",
    NO_OR_MORE_THAN_ONE_SCHEMAS_MATCH: "no (or more than one) schemas match",
    HAS_A_REMAINDER: "has a remainder",
    HAS_MORE_PROPERTIES_THAN_ALLOWED: "has more properties than allowed",
    HAS_LESS_PROPERTIES_THAN_ALLOWED: "has less properties than allowed",
    HAS_MORE_ITEMS_THAN_ALLOWED: "has more items than allowed",
    HAS_LESS_ITEMS_THAN_ALLOWED: "has less items than allowed",
    HAS_LONGER_LENGTH_THAN_ALLOWED: "has longer length than allowed",
    HAS_LESS_LENGTH_THAN_ALLOWED: "has less length than allowed",
    IS_LESS_THAN_MINIMUM: "is less than minimum",
    IS_MORE_THAN_MAXIMUM: "is more than maximum"
  };
}

export default class Validate {
  i18n: I18N;

  constructor({ i18n }: { i18n: I18N }) {
    this.i18n = i18n;
  }

  number = (value: number, node: JSONSchemaExt) => {
    if (!isFinite(value)) {
      return this.i18n.gettext("Not a valid number.");
    }
    invariant(node.instrument != null, "Incomplete schema");
    if (node.instrument.type.range) {
      let failure = this.checkValueRange(value, node.instrument.type.range);
      if (failure !== true) {
        return failure;
      }
    }
    return true;
  };

  integer = (value: number, node: JSONSchemaExt) => {
    if (!isInteger(value)) {
      return this.i18n.gettext("Not a valid whole number.");
    }
    invariant(node.instrument != null, "Incomplete schema");
    if (node.instrument.type.range) {
      let failure = this.checkValueRange(value, node.instrument.type.range);
      if (failure !== true) {
        return failure;
      }
    }
    return true;
  };

  date = (value: string, node: JSONSchemaExt) => {
    const regex = node.dateRegex ? new RegExp(node.dateRegex) : DATE_RE;
    const format = node.dateFormat || ISO_DATE_FORMAT;

    if (!regex.exec(value)) {
      return this.i18n.gettext(`This must be entered in the form: ${format}`);
    }

    const parsedMoment = moment(value, format);
    if (!parsedMoment.isValid()) {
      return this.i18n.gettext("Not a valid date.");
    }

    invariant(node.instrument != null, "Incomplete schema");
    if (node.instrument.type.range) {
      let failure = this.checkValueRange(value, node.instrument.type.range);
      if (failure !== true) {
        return failure;
      }
    }
    return true;
  };

  dateTime = (value: string, node: JSONSchemaExt) => {
    const regex = node.dateTimeRegex
      ? new RegExp(node.dateTimeRegex)
      : DATE_TIME_RE;
    const dateFormat = node.dateFormat || ISO_DATE_FORMAT;

    if (!regex.exec(value)) {
      return this.i18n.gettext(
        `This must be entered in the form: ${dateFormat}THH:MM[:SS]`
      );
    }

    let parts = value.split("T");
    let partDate = parts[0];
    let partTime = parts[1];

    if (!moment(partDate, dateFormat).isValid()) {
      return this.i18n.gettext("Not a valid date.");
    }

    let TIME_FORMAT = "HH:mm:ss";
    if (!moment(partTime, TIME_FORMAT).isValid()) {
      return this.i18n.gettext("Not a valid time.");
    }

    invariant(node.instrument != null, "Incomplete schema");
    if (node.instrument.type.range) {
      let isoValue = moment(partDate, dateFormat).format(ISO_DATE_FORMAT);
      let failure = this.checkValueRange(isoValue, node.instrument.type.range);
      if (failure !== true) {
        return failure;
      }
    }
    return true;
  };

  time = (value: string, node: JSONSchemaExt) => {
    if (!TIME_RE.exec(value)) {
      return this.i18n.gettext("This must be entered in the form: HH:MM[:SS]");
    }
    if (!this.checkLegalTime(value)) {
      return this.i18n.gettext("Not a valid time.");
    }

    invariant(node.instrument != null, "Incomplete schema");
    if (node.instrument.type.range) {
      let failure = this.checkValueRange(value, node.instrument.type.range);
      if (failure !== true) {
        return failure;
      }
    }
    return true;
  };

  recordList = (value: Array<Object>, node: JSONSchemaExt) => {
    value = value || [];

    if (value.length > 0) {
      let errors = [];
      value.forEach((rec, idx) => {
        if (isEmptyValue(rec)) {
          errors.push({
            field: "" + idx,
            message: this.i18n.gettext(
              "You must respond to at least one question in this record."
            )
          });
        }
      });
      if (errors.length > 0) {
        return errors;
      }
    }

    if (isEmptyValue(value)) {
      invariant(node.instrument != null, "Incomplete schema");
      if (node.instrument.required) {
        return this.i18n.gettext("You must provide a response for this field.");
      }
    } else {
      invariant(node.instrument != null, "Incomplete schema");
      if (node.instrument.type.length) {
        let { min, max } = node.instrument.type.length;
        let minFailure = min !== undefined && min > value.length;
        let maxFailure = max !== undefined && max < value.length;
        if (minFailure || maxFailure) {
          let error = { message: undefined, force: true };
          if (min !== undefined && max !== undefined) {
            error.message = this.i18n.gettext(
              "Must enter between %(min)s and %(max)s records.",
              { min, max }
            );
          } else if (min !== undefined) {
            error.message = this.i18n.gettext(
              "Must enter at least %(min)s records.",
              { min }
            );
          } else if (max !== undefined) {
            error.message = this.i18n.gettext(
              "Cannot enter more than %(max)s records.",
              { max }
            );
          }
          return error;
        }
      }
    }
    return true;
  };

  matrix = (value: Object, node: JSONSchemaExt) => {
    if (isEmptyValue(value)) {
      invariant(node.instrument != null, "Incomplete schema");
      if (node.instrument.required) {
        return this.i18n.gettext("You must provide a response for this field.");
      }
    }
    return true;
  };

  matrixRow = (value: Object, node: JSONSchemaExt) => {
    if (isEmptyValue(value)) {
      invariant(node.instrument != null, "Incomplete schema");
      if (node.instrument.required) {
        return this.i18n.gettext("You must provide a response for this row.");
      }
    } else {
      invariant(node.instrument != null, "Incomplete schema");
      const { requiredColumns } = node.instrument;
      invariant(requiredColumns != null, "Invalid schema");
      let errorList: error[] = requiredColumns
        .filter(col => isEmptyValue(value[col]))
        .map(col => {
          let error: error = {
            field: col + ".value",
            message: this.i18n.gettext(
              "You must provide a response for this field."
            ),
            force: true
          };
          return error;
        });
      return errorList.length === 0 ? true : errorList;
    }
    return true;
  };

  enumerationSet = (value: Array<string>, node: JSONSchemaExt) => {
    value = value || [];
    invariant(node.instrument != null, "Incomplete schema");
    if (value.length > 0 && node.instrument.type.length) {
      let { min, max } = node.instrument.type.length;
      let minFailure = min !== undefined && min > value.length;
      let maxFailure = max !== undefined && max < value.length;
      if (minFailure || maxFailure) {
        if (min !== undefined && max !== undefined) {
          return this.i18n.gettext(
            "Must select between %(min)s and %(max)s choices.",
            { min, max }
          );
        } else if (min !== undefined) {
          return this.i18n.gettext("Must select at least %(min)s choices.", {
            min
          });
        } else if (max !== undefined) {
          return this.i18n.gettext("Cannot select more than %(max)s choices.", {
            max
          });
        }
      }
    }
    return true;
  };

  text = (value: string, node: JSONSchemaExt) => {
    value = value || "";
    invariant(node.instrument != null, "Incomplete schema");
    if (node.instrument.type.length) {
      let { min, max } = node.instrument.type.length;
      let minFailure = min !== undefined && min > value.length;
      let maxFailure = max !== undefined && max < value.length;
      if (minFailure || maxFailure) {
        if (min !== undefined && max !== undefined) {
          return this.i18n.gettext(
            "Must be between %(min)s and %(max)s characters.",
            { min, max }
          );
        } else if (min !== undefined) {
          return this.i18n.gettext("Must be at least %(min)s characters.", {
            min
          });
        } else if (max !== undefined) {
          return this.i18n.gettext("Cannot be more than %(max)s characters.", {
            max
          });
        }
      }
    }
    if (node.instrument.type.pattern) {
      if (!(node.instrument.type.pattern instanceof RegExp)) {
        // XXX: We mutate field object here, is it safe?
        node.instrument.type.pattern = new RegExp(node.instrument.type.pattern);
      }
      if (!node.instrument.type.pattern.exec(value)) {
        return this.i18n.gettext("Does not match the expected pattern.");
      }
    }
    return true;
  };

  checkValueRange(value: any, { min, max }: { min?: any, max?: any }) {
    let minFailure = min !== undefined && min > value;
    let maxFailure = max !== undefined && max < value;
    if (minFailure || maxFailure) {
      if (min !== undefined && max !== undefined) {
        return this.i18n.gettext("Must be between %(min)s and %(max)s.", {
          min,
          max
        });
      } else if (min !== undefined) {
        return this.i18n.gettext("Must be at least %(min)s.", { min });
      } else if (max !== undefined) {
        return this.i18n.gettext("Cannot be beyond %(max)s.", { max });
      }
    } else {
      return true;
    }
  }

  // checkLegalDate(dateStr: string): boolean {
  //   let parts = dateStr.split("-").map(Number);
  //   // $FlowIssue: fixme
  //   let parsed = new Date(parts[0], parts[1] - 1, parts[2]);
  //   if (
  //     isNaN(parsed.getTime()) ||
  //     parsed.getFullYear() !== parts[0] ||
  //     parsed.getMonth() !== parts[1] - 1 ||
  //     parsed.getDate() !== parts[2]
  //   ) {
  //     return false;
  //   }
  //   return true;
  // }

  checkLegalTime(timeStr: string): boolean {
    let parts = timeStr.split(":").map(Number);
    if (
      parts[0] < 0 ||
      parts[0] > 23 ||
      (parts[1] < 0 || parts[1] > 59) ||
      (parts[2] < 0 || parts[2] > 59)
    ) {
      return false;
    }
    if (parts.length === 3 && (parts[2] < 0 || parts[2] > 59)) {
      return false;
    }
    return true;
  }
}
