/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var objectPath = require('object-path');

var Calculation = require('./Calculation');
var CALCULATION_TYPES = require('./types');
var properties = require('../properties');
var _ = require('../i18n').gettext;


class Htsql extends Calculation {
  static getType() {
    return CALCULATION_TYPES.TYPE_MANUAL;
  }

  static getName() {
    return _('HTSQL Expression');
  }

  static getTypeID() {
    return 'calculation-htsql';
  }

  static getPropertyConfiguration() {
    var cfg = Calculation.getPropertyConfiguration();
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

  getWorkspaceComponent() {
    return (
      <div className='rfb-workspace-item-details'>
        <div className='rfb-workspace-item-icon'>
          <span className='rfb-icon' />
        </div>
        <div className='rfb-workspace-item-description'>
          {this.id}
        </div>
      </div>
    );
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
    calc.method = 'htsql';
    objectPath.set(calc, 'options.expression', this.expression);

    return calculations;
  }
}


Calculation.registerCalculation(Htsql, function (calculation) {
  if (objectPath.get(calculation, 'method') === 'htsql') {
    var calc = new Htsql();
    calc.parse(calculation);
    return calc;
  }
});


module.exports = Htsql;

