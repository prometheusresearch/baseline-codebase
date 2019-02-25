/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Enumeration = require('./Enumeration');
var properties = require('../../properties');
var _ = require('../../i18n').gettext;


class RadioButtonGroup extends Enumeration {
  static getName() {
    return _('Choose One');
  }

  static getTypeID() {
    return 'question-radiobuttongroup';
  }

  static getPropertyConfiguration(isSubElement) {
    var cfg = Enumeration.getPropertyConfiguration(isSubElement);
    cfg.properties.advanced.unshift(
      {
        name: 'horizontal',
        label: _('Display Choices Horizontally'),
        schema: properties.Bool
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.horizontal = false;
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.horizontal = this.horizontal;
    return newElm;
  }

  parse(element, instrument, field) {
    super.parse(element, instrument, field);
    this.horizontal = objectPath.get(
      element,
      'options.widget.options.orientation',
      'vertical'
    ) === 'horizontal';

    if (!this.autoHotkeys) {
      // Backwards compat; Use of entryRadioGroup basically assumed autoHotkeys
      var widget = objectPath.get(element, 'options.widget.type');
      this.autoHotkeys = (widget === 'entryRadioGroup');
    }
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var field = context.getCurrentSerializationField(instrument);
    objectPath.set(field, 'type.base', 'enumeration');

    if (this.horizontal) {
      var elm = context.getCurrentSerializationElement(form);
      objectPath.set(elm, 'options.widget.type', 'radioGroup');
      objectPath.set(elm, 'options.widget.options.orientation', 'horizontal');
    }

    var elm = context.getCurrentSerializationElement(form);
    if (
        (this.horizontal)
        || (
          objectPath.get(
            elm,
            'options.widget.options',
            undefined
          ) !== undefined
        )) {
      objectPath.set(elm, 'options.widget.type', 'radioGroup');
    }
    if (this.horizontal) {
      objectPath.set(elm, 'options.widget.options.orientation', 'horizontal');
    }

    return {
      instrument,
      form
    };
  }
}


Enumeration.registerElement(
  RadioButtonGroup,
  function (element, instrument, field) {
    if (field.type.rootType === 'enumeration') {
      var widget = objectPath.get(element, 'options.widget.type');
      if (
          !widget
          || (widget === 'radioGroup')
          || (widget === 'entryRadioGroup')) {
        var elm = new RadioButtonGroup();
        elm.parse(element, instrument, field);
        return elm;
      }
    }
  }
);


module.exports = RadioButtonGroup;

