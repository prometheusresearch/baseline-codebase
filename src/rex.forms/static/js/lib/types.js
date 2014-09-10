/**
 * @jsx React.DOM
 */
'use strict';

var baseTypes = require('react-forms').types;
var _         = require('./localization')._;
var utils     = require('./utils');


var generic = baseTypes.any;

generic.getDefaultValue = function () {
  return null;
};

var numberFloat = {

  // TODO: Use I18N lib to parse numbers
  deserialize: function (value) {
    if ((value === '') || (value === null) || (value === undefined)) {
      return null;
    }

    if (utils.isString(value)) {
      value = value.trim();
    } else if (utils.isNumber(value)) {
      value = value.toString();
    }

    var parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed) && (parsed.toString() === value)) {
      return parsed;
    }

    throw new Error(_('Please enter a valid number.'));
  },

  // TODO: Use I18N lib to format number
  serialize: function (value) {
    return value === null ? '' : value.toString();
  },

  getDefaultValue: function () {
    return null;
  }
};

var numberInteger = {

  // TODO: Use I18N lib to parse numbers
  deserialize: function (value) {
    if ((value === '') || (value === null) || (value === undefined)) {
      return null;
    }

    if (utils.isString(value)) {
      value = value.trim();
    } else if (utils.isNumber(value)) {
      value = value.toString();
    }

    var parsed = parseInt(value, 10);
    if (!isNaN(parsed) && isFinite(parsed) && (parsed.toString() === value)) {
      return parsed;
    }

    throw new Error(_('Please enter a valid whole number.'));
  },

  // TODO: Use I18N lib to format number
  serialize: function (value) {
    return value === null ? '' : value.toString();
  },

  getDefaultValue: function () {
    return null;
  }
};

var bool = {

  deserialize: function (value) {
    if (value === true || value === false) {
      return value;
    }

    value = value.trim().toLowerCase();

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    throw new Error(_('Only true or false values are allowed.'));
  },

  serialize: function (value) {
    if (value === null) {
      return '';
    }

    return value ? 'true' : 'false';
  },

  getDefaultValue: function () {
    return null;
  }
};

var array = {

  deserialize: function (value) {
    if (value === null) {
      return [];
    }

    if (!(value instanceof Array)) {
      return [value];
    }

    return value;
  },

  serialize: function (value) {
    if (value === null) {
      return [];
    }

    if (!(value instanceof Array)) {
      return [value];
    }

    return value;
  },

  getDefaultValue: function () {
    return [];
  }
};

var RE_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

var date = {

  // TODO: Use I18N lib to parse date
  deserialize: function (value) {
    if (value instanceof Date) {
      return value;
    }

    value = value.trim();

    if (value === '') {
        return null;
    }

    if (!RE_DATE.test(value)) {
        throw new Error(_('Dates must be entered in YYYY-MM-DD format.'));
    }

    if (isNaN((new Date(value)).getTime())) {
        throw new Error(_('Please enter a valid date.'));
    }

    return value;
  },

  // TODO: Use I18N lib to format date
  serialize: generic.serialize,

  getDefaultValue: function () {
    return null;
  }
};

var RE_TIME = /^(([0-1]?[0-9])|([2][0-3])):([0-5][0-9])(:([0-5][0-9]))?$/;

var time = {

  // TODO: Use I18N lib to parse time
  deserialize: function (value) {
    value = value.trim();

    if (value === '') {
      return null;
    }

    if (!RE_TIME.test(value)) {
      throw new Error(_(
        'Times must be entered in HH:MM:SS format. '
        + 'They are 24-hour based, and seconds are optional.'
      ));
    }

    if ((value.length === 4) || (value.length === 7)) {
      value = '0' + value;
    }
    if (value.length === 5) {
      value = value + ':00';
    }

    return value;
  },

  // TODO: Use I18N lib to format time
  serialize: generic.serialize,

  getDefaultValue: function () {
    return null;
  }
};

var RE_DATETIME = /^([0-9]{4}-[0-9]{2}-[0-9]{2})[ T]?((?:(?:[0-1]?[0-9])|(?:[2][0-3])):(?:[0-5][0-9])(?::(?:[0-5][0-9]))?)?$/;

var dateTime = {

  // TODO: Use I18N lib to parse date
  deserialize: function (value) {
    var match, datePart, timePart;

    value = value.trim();

    if (value === '') {
        return null;
    }

    match = RE_DATETIME.exec(value);
    if (!match) {
        throw new Error(_(
          'Date/Time values must be entered in YYYY-MM-DD HH:MM:SS format. '
          + 'Times are 24-hour based, and seconds are optional.'
        ));
    }

    datePart = date.deserialize(match[1]);

    if (match[2]) {
        timePart = time.deserialize(match[2]);
    } else {
        timePart = '00:00:00';
    }

    // TODO: Capture timezone

    return datePart + 'T' + timePart;
  },

  // TODO: Use I18N lib to format date
  serialize: generic.serialize,

  getDefaultValue: function () {
    return null;
  }
};

function getForInstrumentType(instrumentType) {
  switch (instrumentType.rootType) {
    case 'text':
      return generic;

    case 'float':
      return numberFloat;

    case 'integer':
      return numberInteger;

    case 'enumeration':
      return generic;

    case 'enumerationSet':
      return array;

    case 'boolean':
      return bool;

    case 'date':
      return date;

    case 'time':
      return time;

    case 'dateTime':
      return dateTime;

    default:
      return generic;
  }
}

function getForAnnotation() {
  return generic;
}


function getForExplanation() {
  return generic;
}

module.exports = {
  generic: generic,
  numberFloat: numberFloat,
  numberInteger: numberInteger,
  bool: bool,
  array: array,
  date: date,
  time: time,
  dateTime: dateTime,
  getForAnnotation: getForAnnotation,
  getForExplanation: getForExplanation,
  getForInstrumentType: getForInstrumentType
};
