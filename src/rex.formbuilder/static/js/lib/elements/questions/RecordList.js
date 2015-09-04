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
var {isEmpty} = require('../../util');
var SubFieldContainer = require('../../gui/SubFieldContainer');
var {gettext, getCurrentLocale} = require('../../i18n');
var _ = gettext;


class RecordList extends Question {
  static registerElement(type, parser) {
    var wrappedParser = function (element, instrument, field) {
      if (field.type.rootType === 'recordList') {
        return parser(element, instrument, field);
      }
    };

    Question.registerElement(type, wrappedParser);
  }

  static getPropertyConfiguration() {
    var cfg = Question.getPropertyConfiguration();
    cfg.properties.advanced.unshift(
      {
        name: 'length',
        minLabel: _('Minimum Records'),
        maxLabel: _('Maximum Records'),
        schema: properties.NumericRange
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
    this.length = {};
  }

  parse(element, instrument, field) {
    super.parse(element, instrument, field);

    this.length = objectPath.get(field, 'type.length', {});

    element.options.questions.forEach((elm, index) => {
      try {
        this.questions.push(
          Question.parseQuestion(elm, field.type.record)
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
  }

  getWorkspaceComponent() {
    return (
      <div>
        <div className='rfb-workspace-item-details'>
          <div className='rfb-workspace-item-icon'>
            <span className='rfb-icon' />
          </div>
          <div className='rfb-workspace-item-content'>
            <span>{this.text[getCurrentLocale()]}</span>
          </div>
        </div>
        <SubFieldContainer
          subFields={this.questions}
          />
      </div>
    );
  }

  getEventTargets() {
    var subfields = this.questions.map((question) => {
      return this.id + '.' + question.id;
    });

    return super.getEventTargets().concat(subfields);
  }

  checkValidity() {
    if (this.questions.length < 1) {
      throw new errors.ConfigurationError(_(
        'Repeating Groups must contain at least one question.'
      ));
    }

    return true;
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var field = context.getCurrentSerializationField(instrument);
    field.type = {
      base: 'recordList',
      record: []
    };
    if (!isEmpty(this.length)) {
      objectPath.set(field, 'type.length', this.length);
    }

    var elm = context.getCurrentSerializationElement(form);
    elm.options.questions = [];
    var fakeInstrument = {
      record: field.type.record
    };
    var ctx = new SubFieldSerializationContext();
    this.questions.forEach((question) => {
      question.serialize(fakeInstrument, elm.options, ctx);
      ctx.fixLastSubFieldElement(elm.options);
    });

    return {
      instrument,
      form
    };
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
    newElm.length = deepCopy(this.length);
    newElm.questions = this.questions.map((question) => {
      return question.clone(exact, configurationScope);
    });
    return newElm;
  }
}


module.exports = RecordList;

