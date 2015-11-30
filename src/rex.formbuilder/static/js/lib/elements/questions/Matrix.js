/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var objectPath = require('object-path');
var deepCopy = require('deep-copy');

var SubFieldSerializationContext = require(
  '../../SubFieldSerializationContext'
);
var Question = require('./Question');
var properties = require('../../properties');
var errors = require('../../errors');
var {isEmptyLocalization, isEmpty} = require('../../util');
var SubFieldContainer = require('../../gui/SubFieldContainer');
var _ = require('../../i18n').gettext;


class Matrix extends Question {
  static registerElement(type, parser) {
    var wrappedParser = function (element, instrument, field) {
      if (field.type.rootType === 'matrix') {
        return parser(element, instrument, field);
      }
    };

    Question.registerElement(type, wrappedParser);
  }

  static getPropertyConfiguration() {
    var cfg = Question.getPropertyConfiguration();
    cfg.properties.basic.push(
      {
        name: 'rows',
        schema: properties.RowList,
        label: _('Rows'),
        required: true
      }
    );
    return cfg;
  }

  static isContainingElement() {
    return true;
  }

  static canBeSubField() {
    return false;
  }

  constructor() {
    super();
    this.questions = [];
    this.rows = [];
  }

  getLocaleCoverage() {
    var coverage = super.getLocaleCoverage();

    this.rows.forEach((row) => {
      Object.keys(coverage).forEach((key) => {
        if (!isEmpty(row.text[key])) {
          coverage[key]++;
        }
      });
      coverage.total++;

      ['help', 'audio'].forEach((prop) => {
        if (!isEmptyLocalization(row[prop])) {
          Object.keys(coverage).forEach((key) => {
            if (!isEmpty(row[prop][key])) {
              coverage[key]++;
            }
          });
          coverage.total++;
        }
      });
    });

    return coverage;
  }

  parse(element, instrument, field) {
    super.parse(element, instrument, field);

    element.options.questions.forEach((elm, index) => {
      try {
        this.questions.push(
          Question.parseQuestion(elm, field.type.columns)
        );
      } catch (exc) {
        if (exc instanceof errors.ParsingError) {
          throw new errors.UnsupportedConfigurationError(_(
            'Element #%(index)s in Question %(id)s is not currently supported.',
            {index, id: self.id}
          ));
        } else {
          throw exc;
        }
      }
    });

    this.rows = objectPath.get(element, 'options.rows', []).map((row) => {
      var required = field.type.rows.reduce((previousValue, currentValue) => {
        return previousValue
          || ((currentValue.id === row.id) && currentValue.required);
      }, false);

      return {
        id: row.id,
        required: required,
        text: row.text,
        help: row.help || {},
        audio: row.audio || {}
      };
    });
  }

  getWorkspaceComponent() {
    var {DraftSetStore} = require('../../stores');
    return (
      <div>
        <div className="rfb-workspace-item-details">
          <div className="rfb-workspace-item-icon">
            <span className="rfb-icon" />
          </div>
          <div className="rfb-workspace-item-content">
            <span>{this.text[DraftSetStore.getActiveConfiguration().locale]}</span>
          </div>
        </div>
        <SubFieldContainer
          subFields={this.questions}
          />
      </div>
    );
  }

  getEventTargets() {
    var subfields = [];
    this.rows.forEach((row) => {
      this.questions.forEach((question) => {
        subfields.push([
          this.id,
          row.id,
          question.id
        ].join('.'));
      });
    });

    return super.getEventTargets().concat(subfields);
  }

  checkValidity() {
    super.checkValidity();

    if (this.questions.length < 1) {
      throw new errors.ConfigurationError(_(
        'Grids must contain at least one question.'
      ));
    }
    if (this.rows.length < 1) {
      throw new errors.ConfigurationError(_(
        'Grids must contain at least one row.'
      ));
    }

    var {DraftSetStore} = require('../../stores');
    var defaultLocale = DraftSetStore.getActiveConfiguration().locale;

    this.rows.forEach((row) => {
      if (isEmpty(row.text[defaultLocale])) {
        throw new errors.ConfigurationError(_(
          'A translation is missing in Row text for language "%(locale)s".', {
            locale: defaultLocale
          }
        ));
      }

      ['help', 'audio'].forEach((prop) => {
        if (!isEmptyLocalization(row[prop])) {
          if (isEmpty(row[prop][defaultLocale])) {
            throw new errors.ConfigurationError(_(
              'A translation is missing in Row %(property)s for language "%(locale)s".', {
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

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var field = context.getCurrentSerializationField(instrument);
    field.type = {
      base: 'matrix',
      columns: [],
      rows: []
    };

    var elm = context.getCurrentSerializationElement(form);

    elm.options.questions = [];
    var fakeInstrument = {
      record: field.type.columns
    };
    var ctx = new SubFieldSerializationContext();
    this.questions.forEach((question) => {
      question.serialize(fakeInstrument, elm.options, ctx);
      ctx.fixLastSubFieldElement(elm.options);
    });
    // Ugly hack needed until we can alter the config properties available
    // for subfields.
    field.type.columns.forEach((fld) => {
      delete fld.explanation;
      delete fld.annotation;
    });

    elm.options.rows = [];
    this.rows.forEach((row) => {
      var instRow = {
        id: row.id
      };
      if (row.required) {
        instRow.required = true;
      }
      field.type.rows.push(instRow);

      var formRow = {
        id: row.id,
        text: row.text
      };
      if (!isEmptyLocalization(row.help)) {
        formRow.help = row.help;
      }
      if (!isEmptyLocalization(row.audio)) {
        formRow.audio = row.audio;
      }
      elm.options.rows.push(formRow);
    });

    return {
      instrument,
      form
    };
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.questions = this.questions.map((question) => {
      return question.clone(exact, configurationScope);
    });
    newElm.rows = deepCopy(this.rows);
    return newElm;
  }
}


module.exports = Matrix;

