/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Enumeration = require('./Enumeration');
var _ = require('../../i18n').gettext;


class RadioButtonGroup extends Enumeration {
  static getName() {
    return _('Choose One');
  }

  static getTypeID() {
    return 'question-radiobuttongroup';
  }

  serialize(instrument, form) {
    var {instrument, form} = super(instrument, form);

    var field = this.getCurrentSerializationField(instrument);
    objectPath.set(field, 'type.base', 'enumeration');

    return {
      instrument,
      form
    };
  }
}


Enumeration.registerElement(
  RadioButtonGroup,
  function (element, instrument, field) {
    if (field.type.rootType === 'enumeration') {
      var widget = objectPath.get(element, 'options.widget.type');
      if (!widget || (widget === 'radioGroup')) {
        var elm = new RadioButtonGroup();
        elm.parse(element, instrument, field);
        return elm;
      }
    }
  }
);


module.exports = RadioButtonGroup;

