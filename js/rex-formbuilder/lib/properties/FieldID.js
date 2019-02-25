/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms-old');

var {RE_FIELD_ID} = require('../constants');
var _ = require('../i18n').gettext;


class FieldID extends ReactForms.schema.ScalarNode {
  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    if (!RE_FIELD_ID.test(value)) {
      return new Error(_('Not a valid format for a field identifier.'));
    }
  }
}


module.exports = FieldID;

