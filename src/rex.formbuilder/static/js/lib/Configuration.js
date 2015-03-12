/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var {PageStart} = require('./elements');
var {ConfigurationError} = require('./errors');
var _ = require('./i18n').gettext;


class Configuration {
  constructor(id, version, title, locale) {
    this.id = id;
    this.version = version;
    this.title = title;
    this.locale = locale;

    var page = new PageStart();
    page.id = 'page1';
    this.elements = [page];
  }

  serialize() {
    // Create definition stubs.
    var instrument = {
      id: this.id,
      version: this.version,
      title: this.title,
      record: []
    };
    var form = {
      instrument: {
        id: this.id,
        version: this.version
      },
      defaultLocalization: this.locale,
      title: {},
      pages: []
    };
    form.title[this.locale] = this.title;

    // Serialize the elements to the stubs.
    this.elements.forEach((element) => {
      element.serialize(instrument, form);
    });

    return {
      instrument,
      form
    };
  }

  checkValidity() {
    var lastPageStart = null;

    this.elements.forEach((element, idx) => {
      if (element instanceof PageStart) {
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

    if (lastPageStart === (this.elements.length - 1)) {
      // If the last element on the form was a PageStart,
      // that's a problem.
      throw new ConfigurationError(
        _('Every Page must contain at least one Element.')
      );
    }

    return true;
  }
}


module.exports = Configuration;

