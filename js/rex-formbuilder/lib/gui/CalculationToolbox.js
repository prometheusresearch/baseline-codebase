/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactCreateClass = require('create-react-class');

var Toolbox = require('./Toolbox');
var CalculationTool = require('./CalculationTool');
var {CALCULATION_TYPES, Calculation} = require('../calculations');
var _ = require('../i18n').gettext;


var CalculationToolbox = ReactCreateClass({
  render: function () {
    var groups = [
      {
        id: CALCULATION_TYPES.TYPE_MANUAL,
        label: _('Calculations')
      }
    ];

    return (
      <Toolbox
        groups={groups}
        tools={Calculation.getRegisteredCalculations()}
        toolComponent={CalculationTool.default}
        />
    );
  }
});


module.exports = CalculationToolbox;

