/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Question = require('./Question');
var _ = require('../../i18n').gettext;


class BooleanQuestion extends Question {
  static getName() {
    return _('Boolean');
  }

  static getTypeID() {
    return 'question-boolean';
  }

  serialize(instrument, form) {
    /*eslint no-redeclare:0 */
    var {instrument, form} = super(instrument, form);

    var field = this.getCurrentSerializationField(instrument);
    field.type = 'boolean';

    return {
      instrument,
      form
    };
  }
}


Question.registerElement(
  BooleanQuestion,
  function (element, instrument, field) {
    if (field.type.rootType === 'boolean') {
      var widget = objectPath.get(element, 'options.widget.type');
      if (!widget || (widget === 'radioGroup')) {
        var elm = new BooleanQuestion();
        elm.parse(element, instrument, field);
        return elm;
      }
    }
  }
);


module.exports = BooleanQuestion;

