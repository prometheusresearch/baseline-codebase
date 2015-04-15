/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var objectPath = require('object-path');
var deepCopy = require('deep-copy');

var SerializationContext = require('../../SerializationContext');
var Question = require('./Question');
var properties = require('../../properties');
var errors = require('../../errors');
var {isEmpty} = require('../../util');
var SubFieldContainer = require('../../gui/SubFieldContainer');
var {gettext, getCurrentLocale} = require('../../i18n');
var _ = gettext;


class SubFieldSerializationContext extends SerializationContext {
  getCurrentSerializationElementContainer(elementOptions) {
    return elementOptions.questions;
  }

  fixLastSubFieldElement(elementOptions) {
    var elements = this.getCurrentSerializationElementContainer(elementOptions);
    elements[elements.length - 1] = elements[elements.length - 1].options;
  }
}


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
    super(element, instrument, field);

    this.length = objectPath.get(field, 'type.length', {});

    element.options.questions.forEach((element, index) => {
      try {
        this.questions.push(
          Question.parseQuestion(element, field.type.record)
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
        <div className='rfb-workspace-element-details'>
          <div className='rfb-workspace-element-icon'>
            <span className='rfb-icon' />
          </div>
          <div className='rfb-workspace-element-content'>
            <span>{this.text[getCurrentLocale()]}</span>
          </div>
        </div>
        <SubFieldContainer
          subFields={this.questions}
          />
      </div>
    );
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
    var {instrument, form} = super(instrument, form, context);

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
    var newElm = super(exact, configurationScope);
    newElm.length = deepCopy(this.length);
    newElm.questions = this.questions.map((question) => {
      return question.clone(exact, configurationScope);
    });
    return newElm;
  }
}


module.exports = RecordList;

