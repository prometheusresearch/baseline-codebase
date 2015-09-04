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
        name: 'horizontal',
        label: _('Display Choices Horizontally'),
        schema: properties.Bool
      },
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
    this.horizontal = false;
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.length = deepCopy(this.length);
    newElm.horizontal = this.horizontal;
    return newElm;
  }

  parse(element, instrument, field) {
    super.parse(element, instrument, field);
    this.length = objectPath.get(field, 'type.length', {});
    this.horizontal = objectPath.get(
      element,
      'options.widget.options.orientation',
      'vertical'
    ) === 'horizontal';

    if (!this.autoHotkeys) {
      // Backwards compat; Use of entryCheckGroup basically assumed autoHotkeys
      var widget = objectPath.get(element, 'options.widget.type');
      this.autoHotkeys = (widget === 'entryCheckGroup');
    }
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var field = context.getCurrentSerializationField(instrument);
    objectPath.set(field, 'type.base', 'enumerationSet');

    if (!isEmpty(this.length)) {
      objectPath.set(field, 'type.length', this.length);
    }

    var elm = context.getCurrentSerializationElement(form);
    if (
        this.horizontal
        || (
          objectPath.get(elm, 'options.widget.options', undefined) !== undefined
        )) {
      objectPath.set(elm, 'options.widget.type', 'checkGroup');
    }
    if (this.horizontal) {
      var elm = context.getCurrentSerializationElement(form);
      objectPath.set(elm, 'options.widget.options.orientation', 'horizontal');
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
      if (
          !widget
          || (widget === 'checkGroup')
          || (widget === 'entryCheckGroup')) {
        var elm = new CheckBoxGroup();
        elm.parse(element, instrument, field);
        return elm;
      }
    }
  }
);


module.exports = CheckBoxGroup;

