/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Python = require('./Python');
var properties = require('../properties');
var _ = require('../i18n').gettext;


class PythonCallable extends Python {
  static getName() {
    return _('Python Callable');
  }

  static getTypeID() {
    return 'calculation-python-callable';
  }

  static getPropertyConfiguration() {
    var cfg = Python.getPropertyConfiguration();
    cfg.properties.basic.push(
      {
        name: 'callable',
        label: _('Callable Name'),
        schema: properties.SimpleText,
        required: true
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.callable = null;
  }

  parse(calculation) {
    super.parse(calculation);

    this.callable = objectPath.get(calculation, 'options.callable', null);
  }

  serialize(calculations, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var calculations = super.serialize(calculations, context);

    var calc = this.getCurrentSerializationCalculation(calculations);
    objectPath.set(calc, 'options.callable', this.callable);

    return calculations;
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.callable = this.callable;
    return newElm;
  }
}


Python.registerCalculation(PythonCallable, function (calculation) {
  var callable = objectPath.get(calculation, 'options.callable', undefined);
  if (callable !== undefined) {
    var calc = new PythonCallable();
    calc.parse(calculation);
    return calc;
  }
});


module.exports = PythonCallable;

