/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map, OrderedMap} = require('immutable');

var {RE_PARAMETER_ID} = require('../constants');
var ChoiceProperty = require('./ChoiceProperty');
var _ = require('../i18n').gettext;


class Parameter extends ReactForms.schema.MappingNode {
  static create(props) {
    /*eslint new-cap:0 */

    props = props || {};

    var children = {
      id: ReactForms.schema.Scalar({
        label: _('ID'),
        required: true,
        validate: function (node, value) {
          if (!RE_PARAMETER_ID.test(value)) {
            return new Error(
              _('Not a valid format for a parameter identifier.')
            );
          }
        }
      }),

      type: ChoiceProperty.create({
        label: _('Type'),
        required: true,
        choices: [
          {
            value: 'numeric',
            label: 'Numeric'
          },
          {
            value: 'text',
            label: 'Text'
          },
          {
            value: 'boolean',
            label: 'Boolean'
          }
        ],
        defaultValue: 'numeric'
      })
    };
    props.children = OrderedMap(children);

    delete props.label;

    return new this(Map(props));
  }
}


module.exports = Parameter;

