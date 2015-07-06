/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
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

  static getPropertyConfiguration() {
    var cfg = Question.getPropertyConfiguration();
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
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.length = {};
    this.pattern = null;
  }

  parse(element, instrument, field) {
    super.parse(element, instrument, field);
    this.length = objectPath.get(field, 'type.length', {});
    this.pattern = objectPath.get(field, 'type.pattern', null);
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

    return {
      instrument,
      form
    };
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.length = deepCopy(this.length);
    newElm.pattern = this.pattern;
    return newElm;
  }
}


module.exports = Text;

