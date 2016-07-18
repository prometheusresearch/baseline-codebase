/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');
var deepCopy = require('deep-copy');

var Question = require('./Question');
var properties = require('../../properties');
var {isEmpty} = require('../../util');
var _ = require('../../i18n').gettext;


class BooleanQuestion extends Question {
  static getName() {
    return _('Boolean');
  }

  static getTypeID() {
    return 'question-boolean';
  }

  static getPropertyConfiguration(isSubElement) {
    var cfg = Question.getPropertyConfiguration(isSubElement);
    cfg.properties.advanced.unshift(
      {
        name: 'dropDown',
        label: _('Use a DropDown Widget'),
        schema: properties.Bool
      },
      {
        name: 'hotkeys',
        label: _('Hotkeys'),
        schema: properties.BooleanHotkeys
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.hotkeys = {};
    this.dropDown = false;
  }

  parse(element, instrument, field) {
    super.parse(element, instrument, field);

    this.dropDown = (objectPath.get(element, 'options.widget.type') === 'dropDown');

    var yes = objectPath.get(
      element,
      'options.widget.options.hotkeys.true',
      null
    );
    if (yes !== null) {
      this.hotkeys.yes = yes;
    }

    var no = objectPath.get(
      element,
      'options.widget.options.hotkeys.false',
      null
    );
    if (no !== null) {
      this.hotkeys.no = no;
    }
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var field = context.getCurrentSerializationField(instrument);
    field.type = 'boolean';

    if (!isEmpty(this.hotkeys) || this.dropDown) {
      var elm = context.getCurrentSerializationElement(form);
      objectPath.set(
        elm,
        'options.widget.type',
        this.dropDown ? 'dropDown' : 'radioGroup'
      );

      if (this.hotkeys.yes) {
        objectPath.set(
          elm,
          'options.widget.options.hotkeys.true',
          this.hotkeys.yes
        );
      }
      if (this.hotkeys.no) {
        objectPath.set(
          elm,
          'options.widget.options.hotkeys.false',
          this.hotkeys.no
        );
      }
    }

    return {
      instrument,
      form
    };
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.hotkeys = deepCopy(this.hotkeys);
    newElm.dropDown = this.dropDown;
    return newElm;
  }
}


Question.registerElement(
  BooleanQuestion,
  function (element, instrument, field) {
    if (field.type.rootType === 'boolean') {
      var widget = objectPath.get(element, 'options.widget.type');
      if (!widget || (widget === 'radioGroup') || (widget === 'dropDown')) {
        var elm = new BooleanQuestion();
        elm.parse(element, instrument, field);
        return elm;
      }
    }
  }
);


module.exports = BooleanQuestion;

