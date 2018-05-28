/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Text = require('./Text');
var properties = require('../../properties');
var _ = require('../../i18n').gettext;


class LongText extends Text {
  static getName() {
    return _('Long Text');
  }

  static getTypeID() {
    return 'question-long-text';
  }

  static getPropertyConfiguration(isSubElement) {
    var cfg = Text.getPropertyConfiguration(isSubElement);
    cfg.properties.advanced.unshift(
      {
        name: 'height',
        label: _('Field Height'),
        schema: properties.WidgetSize
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.height = 'medium';
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var elm = context.getCurrentSerializationElement(form);
    objectPath.set(elm, 'options.widget.type', 'textArea');
    if (this.height !== 'medium') {
      objectPath.set(elm, 'options.widget.options.height', this.height);
    }

    return {
      instrument,
      form
    };
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.height = this.height;
    return newElm;
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

