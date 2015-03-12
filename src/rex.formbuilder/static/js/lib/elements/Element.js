/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classSet = React.addons.classSet;

var {ParsingError} = require('../errors');
var properties = require('../properties');
var {isEmpty} = require('../util');
var _ = require('../i18n').gettext;


var ELEMENTS = [];
var PARSERS = [];
var ELEMENT_COUNTER = 0;


class Element {
  static parse(element, instrument) {
    for (var i = 0; i < PARSERS.length; i++) {
      var parsed = PARSERS[i](element, instrument);
      if (parsed) {
        return parsed;
      }
    }

    throw new ParsingError('Could not parse element');
  }

  static registerElement(type, parser) {
    ELEMENTS.push(type);
    if (parser) {
      PARSERS.push(parser);
    }
  }

  static getRegisteredElements() {
    return ELEMENTS;
  }

  static getPropertyConfiguration() {
    return {
      categories: [
        {
          id: 'basic',
          label: _('Configuration')
        },
        {
          id: 'advanced',
          label: _('Advanced Properties')
        }
      ],

      defaultCategory: 'basic',

      properties: {
        basic: [],
        advanced: [
          {
            name: 'tags',
            label: _('Tags'),
            schema: properties.FieldIDList
          }
        ]
      }
    };
  }

  static get ICON_NAME() {
    return null;
  }

  static getIconComponent() {
    var classes = {
      'rfb-icon': true
    };
    if (this.ICON_NAME) {
      classes['icon-' + this.ICON_NAME] = true;
    }
    classes = classSet(classes);

    return (
      <span className={classes} />
    );
  }

  static getToolboxComponent() {
    return (
      <div>
        {this.getIconComponent()}
        {this.getName()}
      </div>
    );
  }

  constructor() {
    this.tags = [];
    this.EID = ELEMENT_COUNTER++;
  }

  parse(element, instrument) {
    /*eslint no-unused-vars:0 */
    this.tags = element.tags || this.tags;
  }

  getCurrentSerializationPage(form) {
    return form.pages[form.pages.length - 1];
  }

  getCurrentSerializationElement(form) {
    var page = this.getCurrentSerializationPage(form);
    return page.elements[page.elements.length - 1];
  }

  getWorkspaceComponent() {
    return (
      <div className='rfb-workspace-element-details'>
        <div className='rfb-workspace-element-content'>
          <p>{this.constructor.getName()}</p>
        </div>
      </div>
    );
  }

  serialize(instrument, form) {
    var elm = {};
    if (!isEmpty(this.tags)) {
      elm.tags = this.tags;
    }

    var page = this.getCurrentSerializationPage(form);
    page.elements.push(elm);

    return {
      instrument,
      form
    };
  }

  clone(exact) {
    var newElm = new this.constructor();
    newElm.tags = this.tags.slice();
    if (exact) {
      newElm.EID = this.EID;
    }
    return newElm;
  }
}


module.exports = Element;

