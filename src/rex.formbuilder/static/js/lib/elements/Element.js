/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classNames = require('classnames');

var SerializationContext = require('../SerializationContext');
var {ParsingError} = require('../errors');
var properties = require('../properties');
var {isEmpty} = require('../util');
var _ = require('../i18n').gettext;


var ELEMENTS = [];
var PARSERS = [];
var ELEMENT_COUNTER = 0;


class Element extends SerializationContext {
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
            schema: properties.TagList
          }
        ]
      }
    };
  }

  static getTypeID() {
    return null;
  }

  static isContainingElement() {
    return false;
  }

  static canBeSubField() {
    return false;
  }

  static getToolboxComponent() {
    var classes = {
      'rfb-toolbox-component': true
    };
    if (this.getTypeID()) {
      classes['rfb-toolbox-component-' + this.getTypeID()] = true;
    }
    classes = classNames(classes);

    return (
      <div className={classes}>
        <span className='rfb-icon' />
        {this.getName()}
      </div>
    );
  }

  constructor() {
    super();
    this.tags = [];
    this.EID = ELEMENT_COUNTER++;
  }

  parse(element, instrument) {
    /*eslint no-unused-vars:0 */
    this.tags = element.tags || this.tags;
  }

  getWorkspaceComponent() {
    return (
      <div className='rfb-workspace-item-details'>
        <div className='rfb-workspace-item-content'>
          <p>{this.constructor.getName()}</p>
        </div>
      </div>
    );
  }

  getEventTargets() {
    return this.tags;
  }

  getTags() {
    return this.tags;
  }

  checkValidity() {
    return true;
  }

  serialize(instrument, form, context) {
    context = context || this;

    var elm = {};
    if (!isEmpty(this.tags)) {
      elm.tags = this.tags;
    }

    var elements = context.getCurrentSerializationElementContainer(form);
    elements.push(elm);

    return {
      instrument,
      form
    };
  }

  clone(exact, configurationScope) {
    var newElm = new this.constructor();
    newElm.tags = this.tags.slice();
    if (exact) {
      newElm.EID = this.EID;
    }
    return newElm;
  }
}


module.exports = Element;

