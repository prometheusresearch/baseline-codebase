/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');

var _ = require('../../i18n').gettext;


var RE_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;


class DateNode extends ReactForms.schema.DateNode {
  serialize(value) {
    return value === null ? '' : value;
  }

  static deserialize(value) {
    if (value === '') {
        return null;
    }

    if (!(value instanceof Date)) {
      if (!RE_DATE.test(value)) {
          return new Error(_(
            'Dates must be entered in YYYY-MM-DD format.'
          ));
      }

      value = new Date(value);

      if (isNaN(value.getTime())) {
          return new Error(_(
            'Please enter a valid date.'
          ));
      }
    }

    return value.toISOString().slice(0, 10);
  }

  deserialize(value) {
    return DateNode.deserialize(value);
  }
}


module.exports = DateNode;

