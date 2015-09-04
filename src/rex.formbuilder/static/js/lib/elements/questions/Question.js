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
var {isEmpty, isEmptyLocalization} = require('../../util');
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


function validateIdUniqueness(node, value) {
  var {DraftSetStore} = require('../../stores');
  var existing = DraftSetStore.findElement(node.ELEMENT);

  var matches = existing.container.filter((element) => {
    /*eslint no-use-before-define:0 */
    return (element instanceof Question)
        && (element.id === value)
        && (element.EID !== node.ELEMENT.EID);
  });

  if (matches.length > 0) {
    return new Error(_(
      'This identifier is already in use.'
    ));
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
        validate: validateIdUniqueness
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
        name: 'audio',
        schema: properties.AudioSource,
        label: _('Audio File URLs')
      },
      {
        name: 'identifiable',
        label: _('Identifiable'),
        schema: properties.Bool
      },
      {
        name: 'explanation',
        label: _('Explanation'),
        schema: properties.RequiredOptional
      },
      {
        name: 'annotation',
        label: _('Annotation'),
        schema: properties.RequiredOptional
      }
    );

    cfg.categories.push({
      id: 'events',
      label: _('Event Logic')
    });
    cfg.properties.events = [];
    cfg.properties.events.push({
      name: 'events',
      schema: properties.EventList
    });

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
    this.events = [];
    this.explanation = 'none';
    this.annotation = 'none';
    this.audio = {};
  }

  parse(element, instrument, field) {
    super.parse(element, instrument);
    this.id = element.options.fieldId;
    this.text = element.options.text;
    this.help = objectPath.get(element, 'options.help', {});
    this.error = objectPath.get(element, 'options.error', {});
    this.required = field.required || false;
    this.identifiable = field.identifiable || false;
    this.events = deepCopy(objectPath.get(element, 'options.events', []));
    this.explanation = objectPath.get(field, 'explanation', 'none');
    this.annotation = objectPath.get(field, 'annotation', 'none');
    this.audio = objectPath.get(element, 'options.audio', {});
  }

  getWorkspaceComponent() {
    return (
      <div className='rfb-workspace-item-details'>
        <div className='rfb-workspace-item-icon'>
          <span className='rfb-icon' />
        </div>
        <div className='rfb-workspace-item-content'>
          <span>{this.text[getCurrentLocale()]}</span>
        </div>
      </div>
    );
  }

  getEventTargets() {
    return super.getEventTargets().concat([this.id]);
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var field = {
      id: this.id
    };
    if (this.required) {
      field.required = true;
    }
    if (this.identifiable) {
      field.identifiable = true;
    }
    if (this.explanation !== 'none') {
      field.explanation = this.explanation;
    }
    if (this.annotation !== 'none') {
      field.annotation = this.annotation;
    }
    instrument.record.push(field);

    var elm = context.getCurrentSerializationElement(form);
    elm.type = 'question';
    objectPath.set(elm, 'options.fieldId', this.id);
    objectPath.set(elm, 'options.text', this.text);
    if (!isEmptyLocalization(this.help)) {
      objectPath.set(elm, 'options.help', this.help);
    }
    if (!isEmptyLocalization(this.error)) {
      objectPath.set(elm, 'options.error', this.error);
    }
    if (!isEmptyLocalization(this.audio)) {
      objectPath.set(elm, 'options.audio', this.audio);
    }

    if (!isEmpty(this.events)) {
      var events = deepCopy(this.events).map((event) => {
        if (!isEmpty(event.options)) {
          var text = objectPath.get(event, 'options.text', undefined);
          if (isEmptyLocalization(text)) {
            delete event.options.text;
          }
          var enums = objectPath.get(event, 'options.enumerations', []);
          if (enums.length === 0) {
            delete event.options.enumerations;
          }
          if (isEmpty(event.options)) {
            delete event.options;
          }
        }

        return event;
      });
      objectPath.set(
        elm,
        'options.events',
        events
      );
    }

    return {
      instrument,
      form
    };
  }

  clone(exact, configurationScope) {
    var newElm = super.clone(exact, configurationScope);
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
    newElm.events = deepCopy(this.events);
    newElm.explanation = this.explanation;
    newElm.annotation = this.annotation;
    return newElm;
  }
}


module.exports = Question;

