/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');
var deepCopy = require('deep-copy');

var Question = require('./Question');
var properties = require('../../properties');
var {isEmpty} = require('../../util');
var _ = require('../../i18n').gettext;


class Numeric extends Question {
  static getPropertyConfiguration() {
    var cfg = Question.getPropertyConfiguration();
    cfg.properties.advanced.unshift(
      {
        name: 'range',
        minLabel: _('Minimum Value'),
        maxLabel: _('Maximum Value'),
        schema: properties.NumericRange
      },
      {
        name: 'width',
        label: _('Field Width'),
        schema: properties.WidgetSize
      }
    );
    return cfg;
  }

  static registerElement(type, parser) {
    return Question.registerElement(type, parser);
  }

  constructor() {
    super();
    this.range = {};
    this.width = 'medium';
  }

  parse(element, instrument, field) {
    super.parse(element, instrument, field);
    this.range = objectPath.get(field, 'type.range', {});
    this.width = objectPath.get(
      element,
      'options.widget.options.width',
      'medium'
    );
  }

  serialize(instrument, form, context, baseType) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var field = context.getCurrentSerializationField(instrument);
    if (!isEmpty(this.range)) {
      objectPath.set(field, 'type.base', baseType);
      objectPath.set(field, 'type.range', this.range);
    } else {
      field.type = baseType;
    }

    if (this.width !== 'medium') {
      var elm = context.getCurrentSerializationElement(form);
      objectPath.set(elm, 'options.widget.type', 'inputNumber');
      objectPath.set(elm, 'options.widget.options.width', this.width);
    }

    return {
      instrument,
      form
    };
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.range = deepCopy(this.range);
    newElm.width = this.width;
    return newElm;
  }
}


module.exports = Numeric;

