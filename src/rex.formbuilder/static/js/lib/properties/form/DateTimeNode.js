/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');

var DateNode = require('./DateNode');
var TimeNode = require('./TimeNode');
var _ = require('../../i18n').gettext;


var RE_DATETIME = /^([0-9]{4}-[0-9]{2}-[0-9]{2})[ T]?((?:(?:[0-1]?[0-9])|(?:[2][0-3])):(?:[0-5][0-9])(?::(?:[0-5][0-9]))?)?$/;


class DateTimeNode extends ReactForms.schema.ScalarNode {
  serialize(value) {
    return value === null ? '' : value;
  }

  static deserialize(value) {
    if (value === '') {
      return null;
    }

    if (!(value instanceof Date)) {
      var match = RE_DATETIME.exec(value);
      if (!match) {
          return new Error(_(
            'Date/Time values must be entered in YYYY-MM-DD HH:MM:SS format.'
            + ' Times are 24-hour based, and seconds are optional.'
          ));
      }

      var datePart = DateNode.deserialize(match[1]);
      var timePart;
      if (match[2]) {
          timePart = TimeNode.deserialize(match[2]);
      } else {
          timePart = '00:00:00';
      }

      return datePart + 'T' + timePart;
    }

    return value.toISOString().split('.')[0];
  }

  deserialize(value) {
    return DateTimeNode.deserialize(value);
  }
}


module.exports = DateTimeNode;

