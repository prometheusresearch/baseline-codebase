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

  serialize(instrument, form) {
    return super(instrument, form, 'integer');
  }
}


Numeric.registerElement(Integer, function (element, instrument, field) {
  if (field.type.rootType === 'integer') {
    var elm = new Integer();
    elm.parse(element, instrument, field);
    return elm;
  }
});


module.exports = Integer;

