/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Matrix = require('./Matrix');
var _ = require('../../i18n').gettext;


class QuestionGrid extends Matrix {
  static getName() {
    return _('Question Grid');
  }

  static getTypeID() {
    return 'question-questiongrid';
  }
}


Matrix.registerElement(
  QuestionGrid,
  function (element, instrument, field) {
    var widget = objectPath.get(element, 'options.widget.type');
    if (!widget || (widget === 'matrix')) {
      var elm = new QuestionGrid();
      elm.parse(element, instrument, field);
      return elm;
    }
  }
);


module.exports = QuestionGrid;

