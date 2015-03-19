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


class DateQuestion extends Question {
  static getName() {
    return _('Date');
  }

  static getTypeID() {
    return 'question-date';
  }

  static getPropertyConfiguration() {
    var cfg = Question.getPropertyConfiguration();
    cfg.properties.advanced.unshift(
      {
        name: 'range',
        minLabel: _('Earliest Date'),
        maxLabel: _('Latest Date'),
        schema: properties.DateRange
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

  serialize(instrument, form) {
    /*eslint no-redeclare:0 */
    var {instrument, form} = super(instrument, form);

    var field = this.getCurrentSerializationField(instrument);
    if (!isEmpty(this.range)) {
      objectPath.set(field, 'type.base', 'date');
      objectPath.set(field, 'type.range', this.range);
    } else {
      field.type = 'date';
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


Question.registerElement(
  DateQuestion,
  function (element, instrument, field) {
    if (field.type.rootType === 'date') {
      var widget = objectPath.get(element, 'options.widget.type');
      if (!widget || (widget === 'datePicker')) {
        var elm = new DateQuestion();
        elm.parse(element, instrument, field);
        return elm;
      }
    }
  }
);


module.exports = DateQuestion;

