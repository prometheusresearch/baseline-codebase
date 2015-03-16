/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var ContentElement = require('./ContentElement');
var properties = require('../properties');
var _ = require('../i18n').gettext;


class PageStart extends ContentElement {
  static getName() {
    return _('Page Start');
  }

  static getPropertyConfiguration() {
    var cfg = ContentElement.getPropertyConfiguration();
    cfg.properties.basic.unshift(
      {
        name: 'id',
        schema: properties.FieldID,
        label: _('Page ID'),
        required: true,
        uniqueAcrossElementType: PageStart
      }
    );
    return cfg;
  }

  static getTypeID() {
    return 'page-start';
  }

  constructor() {
    super();
    this.id = null;
  }

  serialize(instrument, form) {
    var page = {
      id: this.id,
      elements: []
    };

    form.pages.push(page);

    return {
      instrument,
      form
    };
  }

  clone(exact) {
    var newElm = super(exact);
    newElm.id = this.id;
    if (!exact) {
      newElm.id += '_clone';
    }
    return newElm;
  }
}


ContentElement.registerElement(PageStart);


module.exports = PageStart;

