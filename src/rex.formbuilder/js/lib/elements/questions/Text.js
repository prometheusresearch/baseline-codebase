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


class Text extends Question {
  static registerElement(type, parser) {
    var wrappedParser = function (element, instrument, field) {
      if (field.type.rootType === 'text') {
        return parser(element, instrument, field);
      }
    };

    Question.registerElement(type, wrappedParser);
  }

  static getPropertyConfiguration(isSubElement) {
    var cfg = Question.getPropertyConfiguration(isSubElement);
    cfg.properties.advanced.unshift(
      {
        name: 'length',
        minLabel: _('Minimum Length'),
        maxLabel: _('Maximum Length'),
        schema: properties.NumericRange
      },
      {
        name: 'pattern',
        label: _('Pattern Constraint'),
        schema: properties.Regex
      },
      {
        name: 'width',
        label: _('Field Width'),
        schema: properties.WidgetSize
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.length = {};
    this.pattern = null;
    this.width = 'medium';
  }

  parse(element, instrument, field) {
    super.parse(element, instrument, field);
    this.length = objectPath.get(field, 'type.length', {});
    this.pattern = objectPath.get(field, 'type.pattern', null);
    this.width = objectPath.get(
      element,
      'options.widget.options.width',
      'medium'
    );
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var field = context.getCurrentSerializationField(instrument);
    if (!isEmpty(this.length) || this.pattern) {
      objectPath.set(field, 'type.base', 'text');
      if (!isEmpty(this.length)) {
        objectPath.set(field, 'type.length', this.length);
      }
      if (this.pattern) {
        objectPath.set(field, 'type.pattern', this.pattern);
      }
    } else {
      field.type = 'text';
    }

    if (this.width !== 'medium') {
      var elm = context.getCurrentSerializationElement(form);
      objectPath.set(elm, 'options.widget.options.width', this.width);
    }

    return {
      instrument,
      form
    };
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.length = deepCopy(this.length);
    newElm.pattern = this.pattern;
    newElm.width = this.width;
    return newElm;
  }
}


module.exports = Text;

