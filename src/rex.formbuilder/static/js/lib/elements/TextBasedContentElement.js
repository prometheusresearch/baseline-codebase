/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var deepCopy = require('deep-copy');
var objectPath = require('object-path');

var ContentElement = require('./ContentElement');
var properties = require('../properties');
var {gettext, getCurrentLocale} = require('../i18n');
var _ = gettext;


class TextBasedContentElement extends ContentElement {
  static getPropertyConfiguration() {
    var cfg = ContentElement.getPropertyConfiguration();
    cfg.properties.basic.push(
      {
        name: 'text',
        schema: properties.LocalizedText,
        label: _('Text'),
        required: true
      }
    );
    return cfg;
  }

  static registerElement(type, parser) {
    return ContentElement.registerElement(type, parser);
  }

  constructor() {
    super();
    this.text = {};
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.text = deepCopy(this.text);
    return newElm;
  }

  parse(element) {
    super.parse(element);
    this.text = element.options.text;
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var elm = context.getCurrentSerializationElement(form);
    objectPath.set(elm, 'options.text', this.text);

    return {
      instrument,
      form
    };
  }

  getWorkspaceComponent() {
    return (
      <div className='rfb-workspace-element-details'>
        <div className='rfb-workspace-element-icon'>
          <span className='rfb-icon' />
        </div>
        <div className='rfb-workspace-element-content'>
          <span>{this.text[getCurrentLocale()]}</span>
        </div>
      </div>
    );
  }
}


module.exports = TextBasedContentElement;

