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
    cfg.properties.advanced = cfg.properties.advanced.filter((prop) => {
      return prop.name !== 'tags';
    });
    return cfg;
  }

  static getTypeID() {
    return 'page-start';
  }

  constructor() {
    super();
    this.id = null;
  }

  serialize(instrument, form, context) {
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

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.id = this.id;

    if (!exact) {
      var newId = newElm.id;

      if (configurationScope) {
        var unique = false;

        while (!unique) {
          newId += '_clone';

          var matches = configurationScope.filter((element) => {
            /*eslint no-loop-func:0 */
            return (element instanceof PageStart)
                && (element.id === newId);
          });

          unique = (matches.length === 0);
        }
      } else {
        newId += '_clone';
      }

      newElm.id = newId;
    }

    return newElm;
  }
}


ContentElement.registerElement(PageStart);


module.exports = PageStart;

