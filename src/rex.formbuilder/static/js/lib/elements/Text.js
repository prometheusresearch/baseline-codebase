/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var TextBasedContentElement = require('./TextBasedContentElement');
var _ = require('../i18n').gettext;


class Text extends TextBasedContentElement {
  static getName() {
    return _('Text');
  }

  static getTypeID() {
    return 'text';
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var elm = context.getCurrentSerializationElement(form);
    elm.type = 'text';

    return {
      instrument,
      form
    };
  }
}


TextBasedContentElement.registerElement(Text, function (element, instrument) {
  if (element.type === 'text') {
    var elm = new Text();
    elm.parse(element, instrument);
    return elm;
  }
});


module.exports = Text;

