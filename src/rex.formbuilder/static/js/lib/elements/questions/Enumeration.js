/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');
var deepCopy = require('deep-copy');

var Question = require('./Question');
var properties = require('../../properties');
var errors = require('../../errors');
var {isEmptyLocalization, isEmpty} = require('../../util');
var _ = require('../../i18n').gettext;


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
    cfg.properties.advanced.unshift(
      {
        name: 'autoHotkeys',
        label: _('Automatically Assign Hotkeys (unless any are predefined)'),
        schema: properties.Bool
      }
    );
    return cfg;
  }

  constructor() {
    super();
    this.autoHotkeys = false;
    this.enumerations = [];
  }

  getLocaleCoverage() {
    var coverage = super.getLocaleCoverage();

    this.enumerations.forEach((enumeration) => {
      Object.keys(coverage).forEach((key) => {
        if (!isEmpty(enumeration.text[key])) {
          coverage[key]++;
        }
      });
      coverage.total++;

      ['help', 'audio'].forEach((prop) => {
        if (!isEmptyLocalization(enumeration[prop])) {
          Object.keys(coverage).forEach((key) => {
            if (!isEmpty(enumeration[prop][key])) {
              coverage[key]++;
            }
          });
          coverage.total++;
        }
      });
    });

    return coverage;
  }

  checkValidity() {
    super.checkValidity();

    var {DraftSetStore} = require('../../stores');
    var defaultLocale = DraftSetStore.getActiveConfiguration().locale;

    this.enumerations.forEach((enumeration) => {
      if (isEmpty(enumeration.text[defaultLocale])) {
        throw new errors.ConfigurationError(_(
          'A translation is missing in Enumeration text for language "%(locale)s".', {
            locale: defaultLocale
          }
        ));
      }

      ['help', 'audio'].forEach((prop) => {
        if (!isEmptyLocalization(enumeration[prop])) {
          if (isEmpty(enumeration[prop][defaultLocale])) {
            throw new errors.ConfigurationError(_(
              'A translation is missing in Enumeration %(property)s for language "%(locale)s".', {
                locale: defaultLocale,
                property: prop
              }
            ));
          }
        }
      });
    });

    return true;
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.autoHotkeys = this.autoHotkeys;
    newElm.enumerations = deepCopy(this.enumerations);
    return newElm;
  }

  parse(element, instrument, field) {
    super.parse(element, instrument, field);

    this.autoHotkeys = objectPath.get(
      element,
      'options.widget.options.autoHotkeys',
      false
    );

    var enumerations = objectPath.get(element, 'options.enumerations', []);
    var hotkeys = objectPath.get(element, 'options.widget.options.hotkeys', {});
    enumerations = enumerations.map((enumeration) => {
      return {
        id: enumeration.id,
        text: enumeration.text,
        hotkey: hotkeys[enumeration.id] || '',
        help: enumeration.help || {},
        audio: enumeration.audio || {}
      };
    });

    var {I18NStore} = require('../../stores');
    Object.keys(field.type.enumerations).forEach((eid) => {
      var enumeration = enumerations.filter(e => e.id === eid)[0];
      if (!enumeration) {
        var text = {};
        text[I18NStore.getCurrentLocale()] = eid;
        enumerations.push({
          id: eid,
          text: text,
          hotkey: hotkeys[eid] || '',
          help: {},
          audio: {}
        });
      }
    });

    this.enumerations = enumerations;
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var field = context.getCurrentSerializationField(instrument);
    objectPath.set(field, 'type.enumerations', {});

    var elm = context.getCurrentSerializationElement(form);

    var hotkeys = {};
    objectPath.set(elm, 'options.enumerations', []);
    this.enumerations.forEach((enumeration) => {
      field.type.enumerations[enumeration.id] = {};

      var descr = {
        id: enumeration.id,
        text: enumeration.text
      };
      if (!isEmptyLocalization(enumeration.help)) {
        descr.help = enumeration.help;
      }
      if (!isEmptyLocalization(enumeration.audio)) {
        descr.audio = enumeration.audio;
      }
      elm.options.enumerations.push(descr);

      if (enumeration.hotkey) {
        hotkeys[enumeration.id] = enumeration.hotkey;
      }
    });

    if (this.autoHotkeys) {
      objectPath.set(
        elm,
        'options.widget.options.autoHotkeys',
        this.autoHotkeys
      );
    }

    if (Object.keys(hotkeys).length > 0) {
      objectPath.set(elm, 'options.widget.options.hotkeys', hotkeys);
    }

    return {
      instrument,
      form
    };
  }
}


module.exports = Enumeration;

