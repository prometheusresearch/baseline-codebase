/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');
var deepCopy = require('deep-copy');

var Enumeration = require('./Enumeration');
var properties = require('../../properties');
var {isEmpty} = require('../../util');
var _ = require('../../i18n').gettext;


class CheckBoxGroup extends Enumeration {
  static getName() {
    return _('Choose Many');
  }

  static getTypeID() {
    return 'question-checkboxgroup';
  }

  static getPropertyConfiguration() {
    var cfg = Enumeration.getPropertyConfiguration();
    cfg.properties.advanced.unshift(
      {
        name: 'length',
        minLabel: _('Minimum # of Choices'),
        maxLabel: _('Maximum # of Choices'),
        schema: properties.NumericRange
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.length = {};
  }

  clone(exact) {
    var newElm = super(exact);
    newElm.length = deepCopy(this.length);
    return newElm;
  }

  parse(element, instrument, field) {
    super(element, instrument, field);
    this.length = objectPath.get(field, 'type.length', {});
  }

  serialize(instrument, form) {
    /*eslint no-redeclare:0 */
    var {instrument, form} = super(instrument, form);

    var field = this.getCurrentSerializationField(instrument);
    objectPath.set(field, 'type.base', 'enumerationSet');

    if (!isEmpty(this.length)) {
      objectPath.set(field, 'type.length', this.length);
    }

    return {
      instrument,
      form
    };
  }
}


Enumeration.registerElement(
  CheckBoxGroup,
  function (element, instrument, field) {
    if (field.type.rootType === 'enumerationSet') {
      var widget = objectPath.get(element, 'options.widget.type');
      if (!widget || (widget === 'checkGroup')) {
        var elm = new CheckBoxGroup();
        elm.parse(element, instrument, field);
        return elm;
      }
    }
  }
);


module.exports = CheckBoxGroup;


