/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var objectPath = require('object-path');
var deepCopy = require('deep-copy');

var RecordList = require('./RecordList');
var properties = require('../../properties');
var {isEmpty} = require('../../util');
var {gettext, getCurrentLocale} = require('../../i18n');
var _ = gettext;


class RepeatingGroup extends RecordList {
  static getName() {
    return _('Repeating Group');
  }

  static getTypeID() {
    return 'question-repeatinggroup';
  }

  static getPropertyConfiguration() {
    var cfg = RecordList.getPropertyConfiguration();
    cfg.properties.advanced.unshift(
      {
        name: 'addLabel',
        label: _('Add Button Label'),
        schema: properties.LocalizedText
      },
      {
        name: 'removeLabel',
        label: _('Remove Button Label'),
        schema: properties.LocalizedText
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.addLabel = {};
    this.removeLabel = {};
  }

  parse(element, instrument, field) {
    super.parse(element, instrument, field);

    this.addLabel = objectPath.get(
      element,
      'options.widget.options.addLabel',
      {}
    );
    this.removeLabel = objectPath.get(
      element,
      'options.widget.options.removeLabel',
      {}
    );
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var elm = context.getCurrentSerializationElement(form);
    if ((!isEmpty(this.addLabel)) || (!isEmpty(this.removeLabel))) {
      objectPath.set(elm, 'options.widget.type', 'recordList');
      if (!isEmpty(this.addLabel)) {
        objectPath.set(elm, 'options.widget.options.addLabel', this.addLabel);
      }
      if (!isEmpty(this.removeLabel)) {
        objectPath.set(
          elm,
          'options.widget.options.removeLabel',
          this.removeLabel
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
    newElm.addLabel = deepCopy(this.addLabel);
    newElm.removeLabel = deepCopy(this.removeLabel);
    return newElm;
  }
}


RecordList.registerElement(
  RepeatingGroup,
  function (element, instrument, field) {
    var widget = objectPath.get(element, 'options.widget.type');
    if (!widget || (widget === 'recordList')) {
      var elm = new RepeatingGroup();
      elm.parse(element, instrument, field);
      return elm;
    }
  }
);


module.exports = RepeatingGroup;

