/**
 * @copyright 2016, Prometheus Research, LLC
 */

import moment from 'moment';
import {toSnakeCase} from '../lang';

export const DATETIME_ISO_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const DATETIME_ISO_FORMAT_MILLIS = 'YYYY-MM-DD HH:mm:ss.SSSS';
export const DATE_ISO_FORMAT = 'YYYY-MM-DD';

export function string(value, node) {
  if (node.formatPattern) {
    if (new RegExp(node.formatPattern).exec(value) === null) {
      return node.formatError || 'does not match the pattern';
    }
  }
  return true;
}

function isObject(v) {
  return typeof v === 'object' && !Array.isArray(v) && v !== null;
}

export function json(value, node) {
  if (!isObject(value)) {
    try {
      JSON.parse(value);
    } catch (exc) {
      return node.formatError || 'not a valid JSON object';
    }
  }
  return true;
}

export function datetime(value, node) {
  let date = moment(value, [DATETIME_ISO_FORMAT, DATETIME_ISO_FORMAT_MILLIS], true);
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
}

export function date(value, node) {
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
}

export function array(value, node) {
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
}

export const bool = undefined;
export const file = undefined;
export const enumeration = undefined;
export const entity = undefined;
export const integer = undefined;
export const number = undefined;
