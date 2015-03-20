/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var objectPath = require('object-path');
var deepCopy = require('deep-copy');

var Question = require('./Question');
var properties = require('../../properties');
var errors = require('../../errors');
var {isEmpty} = require('../../util');
var {gettext, getCurrentLocale} = require('../../i18n');
var _ = gettext;


class Enumeration extends Question {
  static registerElement(type, parser) {
    var wrappedParser = function (element, instrument, field) {
      if (['enumeration', 'enumerationSet'].indexOf(field.type.rootType) > -1) {
        return parser(element, instrument, field);
      }
    };

    Question.registerElement(type, wrappedParser);
  }

  static getPropertyConfiguration() {
    var cfg = Question.getPropertyConfiguration();
    cfg.properties.basic.push(
      {
        name: 'enumerations',
        schema: properties.EnumerationList,
        label: _('Choices'),
        required: true
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.enumerations = [];
  }

  clone(exact) {
    var newElm = super(exact);
    newElm.enumerations = deepCopy(this.enumerations);
    return newElm;
  }

  parse(element, instrument, field) {
    super(element, instrument, field);

    var enumerations = objectPath.get(element, 'options.enumerations', []);
    enumerations = enumerations.map((enumeration) => {
      if (!isEmpty(enumeration.audio)) {
        throw new errors.UnsupportedConfigurationError(
          _('Audio properties are not currently supported.')
        );
      }

      return {
        id: enumeration.id,
        text: enumeration.text,
        help: enumeration.help || {}
      };
    });

    Object.keys(field.type.enumerations).forEach((eid) => {
      var enumeration = enumerations.filter(e => e.id === eid)[0];
      if (!enumeration) {
        var text = {};
        text[getCurrentLocale()] = eid;
        enumerations.push({
          id: eid,
          text: text,
          help: {}
        });
      }
    });

    this.enumerations = enumerations;
  }

  serialize(instrument, form) {
    /*eslint no-redeclare:0 */
    var {instrument, form} = super(instrument, form);

    var field = this.getCurrentSerializationField(instrument);
    objectPath.set(field, 'type.enumerations', {});

    var elm = this.getCurrentSerializationElement(form);
    objectPath.set(elm, 'options.enumerations', []);

    this.enumerations.forEach((enumeration) => {
      field.type.enumerations[enumeration.id] = {};

      var descr = {
        id: enumeration.id,
        text: enumeration.text
      };
      if (!isEmpty(enumeration.help)) {
        descr.help = enumeration.help;
      }
      elm.options.enumerations.push(descr);
    });

    return {
      instrument,
      form
    };
  }
}


module.exports = Enumeration;

