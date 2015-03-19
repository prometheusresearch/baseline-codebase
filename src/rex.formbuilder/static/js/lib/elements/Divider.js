/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var ContentElement = require('./ContentElement');
var _ = require('../i18n').gettext;


class Divider extends ContentElement {
  static getName() {
    return _('Horizontal Divider');
  }

  static getTypeID() {
    return 'divider';
  }

  constructor() {
    super();
  }

  serialize(instrument, form) {
    /*eslint no-redeclare:0 */
    var {instrument, form} = super(instrument, form);

    var elm = this.getCurrentSerializationElement(form);
    elm.type = 'divider';

    return {
      instrument,
      form
    };
  }
}


ContentElement.registerElement(Divider, function (element, instrument) {
  if (element.type === 'divider') {
    var elm = new Divider();
    elm.parse(element, instrument);
    return elm;
  }
});


module.exports = Divider;

