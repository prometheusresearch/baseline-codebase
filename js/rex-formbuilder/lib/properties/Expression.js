/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms-old');
var RexExpression = require('rex-expression');

var _ = require('../i18n').gettext;


class Expression extends ReactForms.schema.ScalarNode {
  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    try {
      RexExpression.parse(value);
    } catch (exc) {
      return new Error(_('Invalid Expression: %(error)s', {
        error: exc.toString()
      }));
    }
  }
}


module.exports = Expression;

