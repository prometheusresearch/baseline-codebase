/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var Calculation = require('./Calculation');
var CALCULATION_TYPES = require('./types');


class Python extends Calculation {
  static getType() {
    return CALCULATION_TYPES.TYPE_MANUAL;
  }

  static registerCalculation(type, parser) {
    var wrappedParser = function (calculation) {
      if (calculation.method === 'python') {
        return parser(calculation);
      }
    };

    Calculation.registerCalculation(type, wrappedParser);
  }

  getWorkspaceComponent() {
    return (
      <div className="rfb-workspace-item-details">
        <div className="rfb-workspace-item-icon">
          <span className="rfb-icon" />
        </div>
        <div className="rfb-workspace-item-description">
          {this.id}
        </div>
      </div>
    );
  }

  serialize(calculations, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var calculations = super.serialize(calculations, context);

    var calc = this.getCurrentSerializationCalculation(calculations);
    calc.method = 'python';

    return calculations;
  }
}


module.exports = Python;

