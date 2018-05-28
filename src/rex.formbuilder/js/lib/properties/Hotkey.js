/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');

var {RE_HOTKEY} = require('../constants');
var _ = require('../i18n').gettext;


class Hotkey extends ReactForms.schema.ScalarNode {
  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    if (value && !RE_HOTKEY.test(value)) {
      return new Error(
        _('Hotkeys can only be single numeric digits.')
      );
    }
  }
}


module.exports = Hotkey;

