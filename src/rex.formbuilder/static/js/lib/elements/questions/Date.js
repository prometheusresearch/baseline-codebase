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


class DateQuestion extends Question {
  static getName() {
    return _('Date');
  }

  static getTypeID() {
    return 'question-date';
  }

  static getPropertyConfiguration(isSubElement) {
    var cfg = Question.getPropertyConfiguration(isSubElement);
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
    super.parse(element, instrument, field);
    this.range = objectPath.get(field, 'type.range', {});
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var field = context.getCurrentSerializationField(instrument);
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

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
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

