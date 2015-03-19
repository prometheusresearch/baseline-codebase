/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var TextBasedContentElement = require('./TextBasedContentElement');
var _ = require('../i18n').gettext;


class Header extends TextBasedContentElement {
  static getName() {
    return _('Header');
  }

  static getTypeID() {
    return 'header';
  }

  serialize(instrument, form) {
    /*eslint no-redeclare:0 */
    var {instrument, form} = super(instrument, form);

    var elm = this.getCurrentSerializationElement(form);
    elm.type = 'header';

    return {
      instrument,
      form
    };
  }
}


TextBasedContentElement.registerElement(Header, function (element, instrument) {
  if (element.type === 'header') {
    var elm = new Header();
    elm.parse(element, instrument);
    return elm;
  }
});


module.exports = Header;

