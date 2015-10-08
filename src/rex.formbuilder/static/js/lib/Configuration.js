/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var deepCopy = require('deep-copy');

var elements = require('./elements');
var {ConfigurationError} = require('./errors');
var {isEmpty} = require('./util');
var _ = require('./i18n').gettext;


class Configuration {
  constructor(id, version, title, locale) {
    this.id = id;
    this.version = version;
    this.title = title;
    this.locale = locale;

    var page = new elements.PageStart();
    page.id = 'page1';
    this.elements = [page];

    this.calculations = [];
  }

  serialize() {
    // Create definition stubs.
    var instrument = {
      id: this.id,
      version: this.version,
      title: this.title[this.locale],
      record: []
    };
    var form = {
      instrument: {
        id: this.id,
        version: this.version
      },
      defaultLocalization: this.locale,
      title: deepCopy(this.title),
      pages: []
    };

    // Serialize the elements to the stubs.
    this.elements.forEach((element) => {
      element.serialize(instrument, form);
    });

    var calculations = null;
    if (!isEmpty(this.calculations)) {
      calculations = {
        instrument: {
          id: this.id,
          version: this.version
        },
        calculations: []
      };

      this.calculations.forEach((calculation) => {
        calculation.serialize(calculations);
      });
    }

    return {
      instrument,
      form,
      calculations
    };
  }

  checkValidity() {
    if (isEmpty(this.title[this.locale])) {
      throw new ConfigurationError(
        _('The Form Title must have a translation for "%(locale)s"', {
          locale: this.locale
        })
      );
    }

    if (!this.elements || (this.elements.length < 2)) {
      throw new ConfigurationError(
        _('Configuration must contain at least two Elements.')
      );
    }

    if (!(this.elements[0] instanceof elements.PageStart)) {
      throw new ConfigurationError(
        _('Configuration must start with a PageStart Element.')
      );
    }

    var lastPageStart = null;
    var sawFieldBasedElement = false;

    this.elements.forEach((element, idx) => {
      element.checkValidity();

      if (element instanceof elements.Questions.Question) {
        sawFieldBasedElement = true;
      }

      if (element instanceof elements.PageStart) {
        if ((lastPageStart !== null) && (lastPageStart === (idx - 1))) {
          // If the last PageStart we saw was the previous element,
          // that's a problem.
          throw new ConfigurationError(
            _('Every Page must contain at least one Element.')
          );
        }

        lastPageStart = idx;
      }
    });

    if (!sawFieldBasedElement) {
      throw new ConfigurationError(
        _('Configuration must contain at least one field-based Element.')
      );
    }

    if (lastPageStart === (this.elements.length - 1)) {
      // If the last element on the form was a PageStart,
      // that's a problem.
      throw new ConfigurationError(
        _('Every Page must contain at least one Element.')
      );
    }

    if (!isEmpty(this.calculations)) {
      this.calculations.forEach((calculation) => {
        calculation.checkValidity();
      });
    }

    return true;
  }
}


module.exports = Configuration;

