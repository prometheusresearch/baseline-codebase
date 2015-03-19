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

  constructor() {
    super();
    this.text = {};
  }

  clone(exact) {
    var newElm = super(exact);
    newElm.text = deepCopy(this.text);
    return newElm;
  }

  parse(element) {
    super(element);
    this.text = element.options.text;
  }

  serialize(instrument, form) {
    /*eslint no-redeclare:0 */
    var {instrument, form} = super(instrument, form);

    var elm = this.getCurrentSerializationElement(form);
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

