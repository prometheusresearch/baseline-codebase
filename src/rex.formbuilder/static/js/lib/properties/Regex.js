/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');

var _ = require('../i18n').gettext;


class Regex extends ReactForms.schema.ScalarNode {
  validate(value, childrenValidation) {
    var error = super(value, childrenValidation);
    if (error) {
      return error;
    }

    try {
      /*eslint new-cap:0 */
      RegExp(value);
    } catch (err) {
      return new Error(_('Not a valid regular expression.'));
    }
  }
}


module.exports = Regex;

