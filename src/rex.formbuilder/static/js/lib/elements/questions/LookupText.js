/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Text = require('./Text');
var properties = require('../../properties');
var _ = require('../../i18n').gettext;


class LookupText extends Text {
  static getName() {
    return _('Lookup Text');
  }

  static getTypeID() {
    return 'question-short-text';
  }

  static getPropertyConfiguration(isSubElement) {
    var cfg = Text.getPropertyConfiguration(isSubElement);
    cfg.properties.basic.push(
      {
        name: 'query',
        label: _('Lookup Query'),
        required: true,
        schema: properties.LongText
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.query = null;
  }

  parse(element, instrument, field) {
    super.parse(element, instrument, field);
    this.query = objectPath.get(element, 'options.widget.options.query');
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);
    var elm = context.getCurrentSerializationElement(form);

    objectPath.set(elm, 'options.widget.type', 'lookupText');
    objectPath.set(elm, 'options.widget.options.query', this.query);
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.query = this.query;
    return newElm;
  }
}


Text.registerElement(LookupText, function (element, instrument, field) {
  var widget = objectPath.get(element, 'options.widget.type');
  if (widget === 'lookupText') {
    var elm = new LookupText();
    elm.parse(element, instrument, field);
    return elm;
  }
});


module.exports = LookupText;

