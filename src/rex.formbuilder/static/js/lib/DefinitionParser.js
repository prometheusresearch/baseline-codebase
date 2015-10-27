/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var deepCopy = require('deep-copy');
var deepEqual = require('deep-equal');

var Configuration = require('./Configuration');
var InstrumentTypeCatalog = require('./InstrumentTypeCatalog');
var {ParsingError, UnsupportedConfigurationError} = require('./errors');
var {Element, PageStart} = require('./elements');
var {Calculation} = require('./calculations');
var {isEmpty, isEmptyLocalization} = require('./util');
var i18n = require('./i18n');
var _ = i18n.gettext;


class DefinitionParser {
  constructor(instrument, form, calculations) {
    // Make sure we got definitions.
    if (!instrument || !form) {
      throw new ParsingError(
        _('Both an Instrument and Form must be provided.')
      );
    }

    var i;

    // If we got a bunch of forms, make sure they're identical.
    if (Array.isArray(form)) {
      if (form.length >= 2) {
        for (i = 0; i < (form.length - 1); i++) {
          if (!deepEqual(form[i], form[i + 1])) {
            throw new ParsingError(
              _(
                'The Form Configurations associated with this Instrument are'
                + ' not identical, so a consolidated Configuration could not'
                + ' be determined.'
              )
            );
          }
        }
      } else if (form.length === 0) {
        throw new ParsingError(
          _('Both an Instrument and Form must be provided.')
        );
      }

      form = form[0];
    }

    function rebaseTypes(record, catalog) {
      for (var r = 0; r < record.length; r++) {
        record[r].type = catalog.getTypeDefinition(record[r].type);

        if (record[r].type.base === 'recordList') {
          rebaseTypes(record[r].type.record, catalog);
        } else if (record[r].type.base === 'matrix') {
          rebaseTypes(record[r].type.columns, catalog);
        }
      }
    }

    this.instrument = deepCopy(instrument);
    rebaseTypes(this.instrument.record, new InstrumentTypeCatalog(instrument));

    this.form = form;
    this.calculations = calculations;
  }

  getConfiguration() {
    var configuration = new Configuration();
    configuration.id = this.instrument.id;
    configuration.version = this.instrument.version;
    configuration.locale = this.form.defaultLocalization;
    if (isEmptyLocalization(this.form.title)) {
      configuration.title = {
        [configuration.locale]: this.instrument.title
      };
    } else {
      configuration.title = deepCopy(this.form.title);
    }
    configuration.elements = [];
    configuration.calculations = [];

    this.form.pages.forEach((page) => {
      var elm = new PageStart();
      elm.id = page.id;
      configuration.elements.push(elm);

      page.elements.forEach((element, index) => {
        try {
          elm = Element.parse(element, this.instrument);
          configuration.elements.push(elm);
        } catch (exc) {
          if (exc instanceof ParsingError) {
            throw new UnsupportedConfigurationError(_(
              'Element #%(index)s on page "%(page)s" is not currently'
              + ' supported.',
              {
                index: index + 1,
                page: page.id
              }
            ));
          } else {
            throw exc;
          }
        }
      });
    });

    if (!isEmpty(this.form.parameters)) {
      Object.keys(this.form.parameters).forEach((id) => {
        configuration.parameters.push({
          id: id,
          type: this.form.parameters[id].type
        });
      });
    }

    if (!isEmpty(this.calculations)) {
      this.calculations.calculations.forEach((calculation, index) => {
        var calc = null;
        try {
          calc = Calculation.parse(calculation);
          configuration.calculations.push(calc);
        } catch (exc) {
          if (exc instanceof ParsingError) {
            throw new UnsupportedConfigurationError(_(
              'Calculation #%(index)s is not currently supported.',
              {
                index: index + 1
              }
            ));
          } else {
            throw exc;
          }
        }
      });
    }

    return configuration;
  }
}


module.exports = DefinitionParser;

