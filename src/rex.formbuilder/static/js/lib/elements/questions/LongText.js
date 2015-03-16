/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Text = require('./Text');
var _ = require('../../i18n').gettext;


class LongText extends Text {
  static getName() {
    return _('Long Text');
  }

  static getTypeID() {
    return 'question-long-text';
  }

  serialize(instrument, form) {
    var {instrument, form} = super(instrument, form);

    var elm = this.getCurrentSerializationElement(form);
    objectPath.set(elm, 'options.widget.type', 'textArea');

    return {
      instrument,
      form
    };
  }
}


Text.registerElement(LongText, function (element, instrument, field) {
  if (objectPath.get(element, 'options.widget.type') === 'textArea') {
    var elm = new LongText();
    elm.parse(element, instrument, field);
    return elm;
  }
});


module.exports = LongText;

