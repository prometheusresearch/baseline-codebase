/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ContentElement = require('./ContentElement');
var properties = require('../properties');
var _ = require('../i18n').gettext;


function validateIdUniqueness(node, value) {
  var {DraftSetStore} = require('../stores');
  var existing = DraftSetStore.findElement(node.ELEMENT);

  var matches = existing.container.filter((element) => {
    /*eslint no-use-before-define:0 */
    return (element instanceof PageStart)
        && (element.id === value)
        && (element.EID !== node.ELEMENT.EID);
  });

  if (matches.length > 0) {
    return new Error(_(
      'This identifier is already in use.'
    ));
  }
}


class PageStart extends ContentElement {
  static getName() {
    return _('Page Start');
  }

  static getPropertyConfiguration(isSubElement) {
    var cfg = ContentElement.getPropertyConfiguration(isSubElement);
    cfg.properties.basic.unshift(
      {
        name: 'id',
        schema: properties.FieldID,
        label: _('Page ID'),
        required: true,
        validate: validateIdUniqueness
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

  getEventTargets() {
    return super.getEventTargets().concat([this.id]);
  }

  serialize(instrument, form, context) {
    /*eslint no-unused-vars:0 */

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

