/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Python = require('./Python');
var properties = require('../properties');
var _ = require('../i18n').gettext;


class PythonExpression extends Python {
  static getName() {
    return _('Python Expression');
  }

  static getTypeID() {
    return 'calculation-python-expression';
  }

  static getPropertyConfiguration() {
    var cfg = Python.getPropertyConfiguration();
    cfg.properties.basic.push(
      {
        name: 'expression',
        label: _('Expression'),
        schema: properties.SimpleText,
        required: true
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.expression = null;
  }

  parse(calculation) {
    super.parse(calculation);

    this.expression = objectPath.get(calculation, 'options.expression', null);
  }

  serialize(calculations, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var calculations = super.serialize(calculations, context);

    var calc = this.getCurrentSerializationCalculation(calculations);
    objectPath.set(calc, 'options.expression', this.expression);

    return calculations;
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.expression = this.expression;
    return newElm;
  }
}


Python.registerCalculation(PythonExpression, function (calculation) {
  var expr = objectPath.get(calculation, 'options.expression', undefined);
  if (expr !== undefined) {
    var calc = new PythonExpression();
    calc.parse(calculation);
    return calc;
  }
});


module.exports = PythonExpression;

