/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classNames = require('classnames');

var {ParsingError} = require('../errors');
var properties = require('../properties');
var {Question} = require('../elements/questions');
var _ = require('../i18n').gettext;


var CALCULATIONS = [];
var PARSERS = [];
var CALCULATION_COUNTER = 0;


function validateIdUniqueness(node, value) {
  var {DraftSetStore} = require('../stores');
  var existing = DraftSetStore.findCalculation(node.ELEMENT);

  var matches = existing.container.filter((calculation) => {
    return (calculation.id === value)
        && (calculation.CID !== node.ELEMENT.CID);
  });

  if (matches.length > 0) {
    return new Error(_(
      'This identifier is already in use.'
    ));
  }

  var elements = DraftSetStore.getActiveElements();
  matches = elements.filter((element) => {
    return (element instanceof Question)
        && (element.id === value);
  });

  if (matches.length > 0) {
    return new Error(_(
      'This identifier is already in use by a Question.'
    ));
  }

}


class Calculation {
  static parse(calculation) {
    for (var i = 0; i < PARSERS.length; i++) {
      var parsed = PARSERS[i](calculation);
      if (parsed) {
        return parsed;
      }
    }

    throw new ParsingError('Could not parse calculation');
  }

  static registerCalculation(type, parser) {
    CALCULATIONS.push(type);
    if (parser) {
      PARSERS.push(parser);
    }
  }

  static getRegisteredCalculations() {
    return CALCULATIONS;
  }

  static getPropertyConfiguration() {
    return {
      categories: [
        {
          id: 'basic',
          label: _('Configuration')
        },
        {
          id: 'advanced',
          label: _('Advanced Properties')
        }
      ],

      defaultCategory: 'basic',

      properties: {
        basic: [
          {
            name: 'id',
            schema: properties.FieldID,
            label: _('Calculation Name'),
            required: true,
            validate: validateIdUniqueness
          },
          {
            name: 'type',
            schema: properties.SimpleDataType,
            label: _('Resulting Data Type'),
            required: true
          },
          {
            name: 'identifiable',
            label: _('Identifiable'),
            schema: properties.Bool
          }
        ],
        advanced: []
      }
    };
  }

  static getTypeID() {
    return null;
  }

  static getToolboxComponent() {
    var classes = {
      'rfb-toolbox-component': true
    };
    if (this.getTypeID()) {
      classes['rfb-toolbox-component-' + this.getTypeID()] = true;
    }
    classes = classNames(classes);

    return (
      <div className={classes}>
        <span className="rfb-icon" />
        {this.getName()}
      </div>
    );
  }

  constructor() {
    this.id = null;
    this.type = null;
    this.identifiable = false;
    this.CID = CALCULATION_COUNTER++;
  }

  parse(calculation) {
    this.id = calculation.id;
    this.type = calculation.type;
    this.identifiable = calculation.identifiable || false;
  }

  getWorkspaceComponent() {
    return (
      <div className="rfb-workspace-item-details">
        <div className="rfb-workspace-item-content">
          <p>{this.constructor.getName()}</p>
        </div>
      </div>
    );
  }

  checkValidity() {
    return true;
  }

  getCurrentSerializationCalculation(calculations) {
    return calculations.calculations[calculations.calculations.length - 1];
  }

  serialize(calculations, context) {
    context = context || this;

    var calc = {
      id: this.id,
      type: this.type
    };

    if (this.identifiable) {
      calc.identifiable = true;
    }

    calculations.calculations.push(calc);

    return calculations;
  }

  clone(exact, configurationScope) {
    var newElm = new this.constructor();

    newElm.id = this.id;
    if (!exact) {
      var newId = newElm.id;

      if (configurationScope) {
        var unique = false;

        while (!unique) {
          newId += '_clone';

          var matches = configurationScope.filter((calculation) => {
            /*eslint no-loop-func:0 */
            return (calculation instanceof Calculation)
                && (calculation.id === newId);
          });

          unique = (matches.length === 0);
        }
      } else {
        newId += '_clone';
      }

      newElm.id = newId;
    }

    newElm.type = this.type;
    newElm.identifiable = this.identifiable;

    if (exact) {
      newElm.CID = this.CID;
    }
    return newElm;
  }
}


module.exports = Calculation;

