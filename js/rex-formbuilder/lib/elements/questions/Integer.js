/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Numeric = require('./Numeric');
var _ = require('../../i18n').gettext;


class Integer extends Numeric {
  static getName() {
    return _('Integer');
  }

  static getTypeID() {
    return 'question-integer';
  }

  serialize(instrument, form, context) {
    return super.serialize(instrument, form, context, 'integer');
  }
}


Numeric.registerElement(Integer, function (element, instrument, field) {
  if (field.type.rootType === 'integer') {
    var widget = objectPath.get(element, 'options.widget.type');
    if (!widget || (widget === 'inputNumber')) {
      var elm = new Integer();
      elm.parse(element, instrument, field);
      return elm;
    }
  }
});


module.exports = Integer;

