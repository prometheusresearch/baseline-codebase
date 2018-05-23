/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Text = require('./Text');
var _ = require('../../i18n').gettext;


class ShortText extends Text {
  static getName() {
    return _('Short Text');
  }

  static getTypeID() {
    return 'question-short-text';
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);
    var elm = context.getCurrentSerializationElement(form);

    if (objectPath.get(elm, 'options.widget', undefined) !== undefined) {
      objectPath.set(elm, 'options.widget.type', 'inputText');
    }
  }
}


Text.registerElement(ShortText, function (element, instrument, field) {
  var widget = objectPath.get(element, 'options.widget.type');
  if (!widget || (widget === 'inputText')) {
    var elm = new ShortText();
    elm.parse(element, instrument, field);
    return elm;
  }
});


module.exports = ShortText;

