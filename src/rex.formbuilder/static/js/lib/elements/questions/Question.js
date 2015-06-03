/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var objectPath = require('object-path');
var deepCopy = require('deep-copy');

var Element = require('../Element');
var ELEMENT_TYPES = require('../types');
var errors = require('../../errors');
var properties = require('../../properties');
var {isEmpty} = require('../../util');
var {gettext, getCurrentLocale} = require('../../i18n');
var _ = gettext;


var QUESTION_PARSERS = [];


function findField(instrument, id) {
  for (var i = 0; i < instrument.record.length; i++) {
    if (instrument.record[i].id === id) {
      return instrument.record[i];
    }
  }
}


class Question extends Element {
  static getType() {
    return ELEMENT_TYPES.TYPE_QUESTION;
  }

  static registerElement(type, parser) {
    var wrappedParser;

    if (parser) {
      QUESTION_PARSERS.push(parser);

      wrappedParser = function (element, instrument) {
        if (element.type === 'question') {
          var field = findField(instrument, element.options.fieldId);
          return parser(element, instrument, field);
        }
      };
    }

    Element.registerElement(type, wrappedParser);
  }

  static parseQuestion(options, record) {
    for (var i = 0; i < QUESTION_PARSERS.length; i++) {
      var field = findField({record}, options.fieldId);
      var parsed = QUESTION_PARSERS[i]({options}, {record}, field);
      if (parsed) {
        return parsed;
      }
    }

    throw new errors.ParsingError('Could not parse Question');
  }

  static getPropertyConfiguration() {
    var cfg = Element.getPropertyConfiguration();
    cfg.properties.basic.push(
      {
        name: 'id',
        schema: properties.FieldID,
        label: _('Field Name'),
        required: true,
        uniqueAcrossElementType: Question
      },
      {
        name: 'text',
        schema: properties.LocalizedText,
        label: _('Question'),
        required: true
      },
      {
        name: 'required',
        label: _('Required'),
        schema: properties.Bool
      }
    );

    cfg.properties.advanced.unshift(
      {
        name: 'help',
        label: _('Help Text'),
        schema: properties.LocalizedText
      },
      {
        name: 'error',
        label: _('Error Text'),
        schema: properties.LocalizedText
      },
      {
        name: 'identifiable',
        label: _('Identifiable'),
        schema: properties.Bool
      }
    );

    return cfg;
  }

  static getTypeID() {
    return 'question';
  }

  static canBeSubField() {
    return true;
  }

  constructor() {
    super();
    this.id = null;
    this.text = {};
    this.help = {};
    this.error = {};
    this.required = false;
    this.identifiable = false;
  }

  parse(element, instrument, field) {
    super(element, instrument);
    this.id = element.options.fieldId;
    this.text = element.options.text;
    this.help = objectPath.get(element, 'options.help', {});
    this.error = objectPath.get(element, 'options.error', {});
    this.required = field.required || false;
    this.identifiable = field.identifiable || false;

    if (!isEmpty(objectPath.get(element, 'options.events', []))) {
      throw new errors.UnsupportedConfigurationError(
        _('Event logic is not currently supported.')
      );
    }
  }

  getWorkspaceComponent() {
    return (
      <div className='rfb-workspace-element-details'>
        <div className='rfb-workspace-element-icon'>
          <span className='rfb-icon' />
        </div>
        <div className='rfb-workspace-element-content'>
          <span>{this.text[getCurrentLocale()]}</span>
        </div>
      </div>
    );
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super(instrument, form, context);

    var field = {
      id: this.id
    };
    if (this.required) {
      field.required = true;
    }
    if (this.identifiable) {
      field.identifiable = true;
    }
    instrument.record.push(field);

    var elm = context.getCurrentSerializationElement(form);
    elm.type = 'question';
    objectPath.set(elm, 'options.fieldId', this.id);
    objectPath.set(elm, 'options.text', this.text);
    if (!isEmpty(this.help)) {
      objectPath.set(elm, 'options.help', this.help);
    }
    if (!isEmpty(this.error)) {
      objectPath.set(elm, 'options.error', this.error);
    }

    return {
      instrument,
      form
    };
  }

  clone(exact, configurationScope) {
    var newElm = super(exact, configurationScope);
    newElm.id = this.id;

    if (!exact) {
      var newId = newElm.id;

      if (configurationScope) {
        var unique = false;

        while (!unique) {
          newId += '_clone';

          var matches = configurationScope.filter((element) => {
            /*eslint no-loop-func:0 */
            return (element instanceof Question)
                && (element.id === newId);
          });

          unique = (matches.length === 0);
        }
      } else {
        newId += '_clone';
      }

      newElm.id = newId;
    }

    newElm.text = deepCopy(this.text);
    newElm.help = deepCopy(this.help);
    newElm.error = deepCopy(this.error);
    newElm.required = this.required;
    newElm.identifiable = this.identifiable;
    return newElm;
  }
}


module.exports = Question;
