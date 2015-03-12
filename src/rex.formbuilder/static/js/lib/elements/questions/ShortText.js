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

