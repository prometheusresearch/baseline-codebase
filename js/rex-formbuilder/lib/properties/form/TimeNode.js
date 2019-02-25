/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms-old');

var _ = require('../../i18n').gettext;


var IS_TIME_RE = /^(([0-1]?[0-9])|([2][0-3])):([0-5][0-9])(:([0-5][0-9]))?$/;


class TimeNode extends ReactForms.schema.ScalarNode {
  serialize(value) {
    return value === null ? '' : value;
  }

  static deserialize(value) {
    if (value === '') {
      return null;
    }

    if (!(value instanceof Date)) {
      if (!IS_TIME_RE.exec(value)) {
        return new Error(_(
          'Times must be entered in HH:MM:SS format.'
          + ' They are 24-hour based, and seconds are optional.'
        ));
      }

      if ((value.length === 4) || (value.length === 7)) {
        value = '0' + value;
      }
      if (value.length === 5) {
        value = value + ':00';
      }

      value = new Date('2015-01-01T' + value);
    }

    return value.toISOString().slice(11, 19);
  }

  deserialize(value) {
    return TimeNode.deserialize(value);
  }
}


module.exports = TimeNode;

