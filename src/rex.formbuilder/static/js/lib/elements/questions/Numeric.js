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


class Numeric extends Question {
  static getPropertyConfiguration() {
    var cfg = Question.getPropertyConfiguration();
    cfg.properties.advanced.unshift(
      {
        name: 'range',
        minLabel: _('Minimum Value'),
        maxLabel: _('Maximum Value'),
        schema: properties.NumericRange
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.range = {};
  }

  parse(element, instrument, field) {
    super(element, instrument, field);
    this.range = objectPath.get(field, 'type.range', {});
  }

  serialize(instrument, form, baseType) {
    var {instrument, form} = super(instrument, form);

    var field = this.getCurrentSerializationField(instrument);
    if (!isEmpty(this.range)) {
      objectPath.set(field, 'type.base', baseType);
      objectPath.set(field, 'type.range', this.range);
    } else {
      field.type = baseType;
    }

    return {
      instrument,
      form
    };
  }

  clone(exact) {
    var newElm = super(exact);
    newElm.range = deepCopy(this.range);
    return newElm;
  }
}


module.exports = Numeric;

