/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var deepCopy = require('deep-copy');
var objectPath = require('object-path');

var ContentElement = require('./ContentElement');
var properties = require('../properties');
var _ = require('../i18n').gettext;


class Audio extends ContentElement {
  static getName() {
    return _('Audio File Player');
  }

  static getTypeID() {
    return 'audio';
  }

  static getPropertyConfiguration(isSubElement) {
    var cfg = ContentElement.getPropertyConfiguration(isSubElement);
    cfg.properties.basic.push(
      {
        name: 'source',
        schema: properties.AudioSource,
        label: _('Audio File URLs'),
        required: true
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.source = {};
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.source = deepCopy(this.source);
    return newElm;
  }

  parse(element) {
    super.parse(element);
    this.source = objectPath.get(element, 'options.source', {});
  }

  getLocalizedProperties() {
    var props = super.getLocalizedProperties();
    props.required.push('source');
    return props;
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var elm = context.getCurrentSerializationElement(form);
    elm.type = 'audio';
    objectPath.set(elm, 'options.source', this.source);

    return {
      instrument,
      form
    };
  }
}


ContentElement.registerElement(Audio, function (element, instrument) {
  if (element.type === 'audio') {
    var elm = new Audio();
    elm.parse(element, instrument);
    return elm;
  }
});


module.exports = Audio;

