/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map, OrderedMap} = require('immutable');

var ChoiceProperty = require('./ChoiceProperty');
var Expression = require('./Expression');
var EventEnumerationList = require('./EventEnumerationList');
var LocalizedText = require('./LocalizedText');
var MultiChoiceProperty = require('./MultiChoiceProperty');
var Fieldset = require('./form/Fieldset');
var {isEmptyLocalization} = require('../util');
var _ = require('../i18n').gettext;


class Event extends ReactForms.schema.MappingNode {
  static create(props) {
    props = props || {};

    props.component = Fieldset;

    var {DraftSetStore} = require('../stores');

    /*eslint new-cap:0 */
    props.children = OrderedMap({
      action: ChoiceProperty.create({
        label: _('Action'),
        required: true,
        choices: [
          {value: 'hide', label: _('Hide')},
          {value: 'disable', label: _('Disable')},
          {value: 'fail', label: _('Fail')},
          {value: 'hideEnumeration', label: _('Hide Enumerations')}
        ],
        defaultValue: 'hide'
      }),

      trigger: Expression.create({
        label: _('Trigger Expression'),
        required: true
      }),

      targets: MultiChoiceProperty.create({
        label: _('Targets'),
        choices: DraftSetStore.getEventTargets().map((target) => {
          return {
            value: target,
            label: target
          };
        })
      }),

      options: ReactForms.schema.MappingNode.create({
        children: OrderedMap({
          text: LocalizedText.create({
            label: _('Message'),
            required: false
          }),

          enumerations: EventEnumerationList.create({
            label: _('Enumerations'),
            required: false
          })
        })
      })
    });

    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    var hasText = false;
    var hasEnums = false;
    var options = value.get('options');
    if (options) {
      if (options.has('text')) {
        hasText = !isEmptyLocalization(value.get('options').get('text').toJS());
      }
      if (options.has('enumerations')) {
        var enumerations = options.get('enumerations');
        hasEnums = enumerations ? (enumerations.count() > 0) : false;
      }
    }

    var action = value.get('action');
    if (hasText && (action !== 'fail')) {
      return new Error(_('Only "fail" Events can have a Message'));
    } else if (!hasText && (action === 'fail')) {
      return new Error(_('"fail" Events require a Message'));
    }
    if (hasEnums && (action !== 'hideEnumeration')) {
      return new Error(_(
        'Only "hideEnumeration" Events can have Enumerations'
      ));
    } else if (!hasEnums && (action === 'hideEnumeration')) {
      return new Error(_(
        '"hideEnumeration" Events require at least one Enumeration'
      ));
    }
  }
}


module.exports = Event;

