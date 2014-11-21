/**
 * @jsx React.DOM
 */
'use strict';

var _ = require('./localization')._;

function buildValidator(rules) {
  return function(value) {
    if (value !== null) {
      try {
        rules.forEach(function(rule) {
          rule(value);
        });
      } catch (exc) {
        return exc.message;
      }
    }

    return true;
  };
}

function validateAnnotation(value, schema) {
  if (schema.annotation === 'required'
      && (value.value === null || value.value === undefined)
      && (value.annotation === null || value.annotation === undefined)) {
    return false;
  }
  return true;
}

function length(options) {
  var min = options.min === undefined ? -1 : options.min;
  var max = options.max === undefined ? -1 : options.max;

  return function (value) {
    if (value.length === undefined) {
      throw new Error(
        _('Cannot measure length of "%(value)s"',
          {value: value.toString()}));
    }

    if (min >= 0 && value.length < min) {
      throw new Error(
        _('Cannot be less than a length of %(value)s', {value: min}));
    }

    if (max >= 0 && value.length > max) {
      throw new Error(
        _('Cannot be more than a length of %(value)s', {value: max}));
    }
  };
}


function pattern(options) {
  var regex = new RegExp(options);

  return function (value) {
    if (!regex.test(value)) {
      throw new Error(_('Does not match the accepted pattern'));
    }
  };
}


function enumeration(options) {
  var enumerations = Object.keys(options);

  return function (value) {
    if (enumerations.indexOf(value) === -1) {
      throw new Error(
        _('"%(value)s" is not an acceptable value', {value: value}));
    }
  };
}


function enumerationSet(options) {
  var enumValidator = enumeration(options);

  return function (value) {
    value.forEach(enumValidator);
  };
}


function range(options) {
  var min = options.min === undefined ? null : options.min;
  var max = options.max === undefined ? null : options.max;
  var normalizer = options.normalizer || function(val) { return val; };
  var formatter = options.formatter || function (val) { return val; };

  return function (value) {
    value = normalizer(value);

    if ((min !== null) && (value < min)) {
      throw new Error(
        _('Cannot be less than %(value)s',
          {value: formatter(min)}));
    }

    if ((max !== null) && (value > max)) {
      throw new Error(
        _('Cannot be greater than %(value)s',
          {value: formatter(max)}));
    }
  };
}


function dateRange(options) {
  var min, max;

  if (options.min !== undefined) {
    min = new Date(options.min);
    if (isNaN(min.getTime())) {
      min = null;
    }
  }

  if (options.max !== undefined) {
    max = new Date(options.max);
    if (isNaN(max.getTime())) {
      max = null;
    }
  }

  return range({
    min: min,
    max: max,
    formatter: function (value) {
      // TODO: Use I18N lib to format date.
      var out = (
        value.getUTCFullYear()
        + '-' + value.getUTCMonth()
        + '-' + value.getUTCDate()
      );
      return out;
    },
    normalizer: function (value) {
      return new Date(value);
    }
  });
}


function timeRange(options) {
  var min, max;

  if (options.min !== undefined) {
    min = new Date('2014-01-01T' + options.min);
    if (isNaN(min.getTime())) {
      min = null;
    }
  }

  if (options.max !== undefined) {
    max = new Date('2014-01-01T' + options.max);
    if (isNaN(max.getTime())) {
      max = null;
    }
  }

  return range({
    min: min,
    max: max,
    formatter: function (value) {
      // TODO: Use I18N lib to format time
      var out = value.getUTCHours() + ':' + value.getUTCMinutes(),
          seconds = value.getUTCSeconds();
      if (seconds) {
          out += ':' + seconds;
      }
      return out;
    },
    normalizer: function (value) {
      return new Date('2014-01-01T' + value);
    }
  });
}


// These bounds conveniently align to the 4-byte integers used in Postgres.
var INT_MAX = 2147483647;
var INT_MIN = -2147483648;

function integerCheck(value) {
  if (isNaN(value) || value > INT_MAX || value < INT_MIN) {
    throw new Error(
      _('This number is outside the acceptible bounds for an integer.'));
  }
}

var TYPE_VALIDATOR_BASE = {
    'integer': [
        integerCheck
    ]
};

var TYPE_VALIDATOR_RULES = {
    'text': {
        'length': length,
        'pattern': pattern
    },

    'integer': {
        'range': range
    },

    'float': {
        'range': range
    },

    'date': {
        'range': dateRange
    },

    'time': {
        'range': timeRange
    },

    'dateTime': {
        'range': dateRange
    },

    'enumeration': {
        'enumeration': enumeration
    },

    'enumerationSet': {
        'enumeration': enumerationSet,
        'length': length
    },

    'recordList': {
        'length': length
    }

};


function getForInstrumentType(instrumentType) {
  var rules = [];
  var baseChecks = TYPE_VALIDATOR_BASE[instrumentType.rootType] || [];
  var typeRules = TYPE_VALIDATOR_RULES[instrumentType.rootType] || {};

  baseChecks.forEach(function (check) {
    rules.push(check);
  });

  Object.keys(typeRules).forEach(function (ruleName) {
    if (instrumentType.hasOwnProperty(ruleName)) {
      rules.push(typeRules[ruleName](
        instrumentType[ruleName]
      ));
    }
  });

  return buildValidator(rules);
}


function getForAnnotation() {
  return buildValidator([]);
}


function getForExplanation() {
  // TODO handle
  // if (instrumentField.explanation === 'required') {
  //
  // }
  return buildValidator([]);
}


module.exports = {
  getForAnnotation,
  getForExplanation,
  getForInstrumentType,
  validateAnnotation
};

