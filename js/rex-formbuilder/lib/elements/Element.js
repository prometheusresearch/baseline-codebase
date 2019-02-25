/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

var React = require('react');
var classNames = require('classnames');

var SerializationContext = require('../SerializationContext');
var {ParsingError, ConfigurationError} = require('../errors');
var properties = require('../properties');
var {isEmpty, isEmptyLocalization} = require('../util');
var _ = require('../i18n').gettext;

// needed so webpack doesn't remove it!
var _usedReact = React;

var ELEMENTS = [];
var PARSERS = [];
var ELEMENT_COUNTER = 0;


class Element extends SerializationContext {
  static parse(element, instrument) {
    for (var i = 0; i < PARSERS.length; i++) {
      var parsed = PARSERS[i](element, instrument);
      if (parsed) {
        return parsed;
      }
    }

    throw new ParsingError('Could not parse element');
  }

  static registerElement(type, parser) {
    ELEMENTS.push(type);
    if (parser) {
      PARSERS.push(parser);
    }
  }

  static getRegisteredElements() {
    return ELEMENTS;
  }

  static getPropertyConfiguration(isSubElement) {
    var cfg = {
      categories: [
        {
          id: 'basic',
          label: _('Configuration')
        },
        {
          id: 'advanced',
          label: _('Advanced Properties')
        }
      ],

      defaultCategory: 'basic',

      properties: {
        basic: [],
        advanced: []
      }
    };

    if (!isSubElement) {
      cfg.properties.advanced.push({
        name: 'tags',
        label: _('Tags'),
        schema: properties.TagList
      });
    }

    return cfg;
  }

  static getTypeID() {
    return null;
  }

  static isContainingElement() {
    return false;
  }

  static canBeSubField() {
    return false;
  }

  static getToolboxComponent() {
    var classes = {
      'rfb-toolbox-component': true
    };
    if (this.getTypeID()) {
      classes['rfb-toolbox-component-' + this.getTypeID()] = true;
    }
    classes = classNames(classes);

    return (
      <div className={classes}>
        <span className="rfb-icon" />
        {this.getName()}
      </div>
    );
  }

  constructor() {
    super();
    this.tags = [];
    this.EID = ELEMENT_COUNTER++;
  }

  parse(element, instrument) {
    /*eslint no-unused-vars:0 */
    this.tags = element.tags || this.tags;
  }

  getWorkspaceComponent(defaultLocale) {
    return (
      <div className="rfb-workspace-item-details">
        <div className="rfb-workspace-item-content">
          <p>{this.constructor.getName()}</p>
        </div>
      </div>
    );
  }

  getEventTargets() {
    return this.tags;
  }

  getTags() {
    return this.tags;
  }

  getLocalizedProperties() {
    return {
      'required': [],
      'optional': []
    };
  }

  getLocaleCoverage() {
    var {I18NStore} = require('../stores');
    var locales = I18NStore.getSupportedLocales().map((locale) => {
      return locale.id;
    });
    var coverage = {'total': 0};
    locales.forEach((locale) => {
      coverage[locale] = 0;
    });

    var props = this.getLocalizedProperties();
    props.required.forEach((prop) => {
      locales.forEach((locale) => {
        if (!isEmpty(this[prop][locale])) {
          coverage[locale]++;
        }
      });
      coverage.total++;
    });
    props.optional.forEach((prop) => {
      if (!isEmptyLocalization(this[prop])) {
        locales.forEach((locale) => {
          if (!isEmpty(this[prop][locale])) {
            coverage[locale]++;
          }
        });
        coverage.total++;
      }
    });

    return coverage;
  }

  checkValidity(defaultLocale) {
    var props = this.getLocalizedProperties();
    props.required.forEach((prop) => {
      if (isEmpty(this[prop][defaultLocale])) {
        throw new ConfigurationError(_(
          'A translation is missing for language "%(locale)s".', {
            locale: defaultLocale
          }
        ));
      }
    });
    props.optional.forEach((prop) => {
      if (!isEmptyLocalization(this[prop])) {
        if (isEmpty(this[prop][defaultLocale])) {
          throw new ConfigurationError(_(
            'A translation is missing for language "%(locale)s".', {
              locale: defaultLocale
            }
          ));
        }
      }
    });

    return true;
  }

  serialize(instrument, form, context) {
    context = context || this;

    var elm = {};
    if (!isEmpty(this.tags)) {
      elm.tags = this.tags;
    }

    var elements = context.getCurrentSerializationElementContainer(form);
    elements.push(elm);

    return {
      instrument,
      form
    };
  }

  clone(exact, configurationScope) {
    var newElm = new this.constructor();
    newElm.tags = this.tags.slice();
    if (exact) {
      newElm.EID = this.EID;
    }
    return newElm;
  }
}


module.exports = Element;

