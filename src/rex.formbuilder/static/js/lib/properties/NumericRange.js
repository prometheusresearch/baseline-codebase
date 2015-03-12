/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map, OrderedMap} = require('immutable');

var Fieldset = require('./form/Fieldset');
var _ = require('../i18n').gettext;


class NumericRange extends ReactForms.schema.MappingNode {
  static create(props) {
    props = props || {};

    props.component = Fieldset;

    props.children = OrderedMap({
      min: ReactForms.schema.NumberNode.create({
        label: props.minLabel || _('Minimum')
      }),
      max: ReactForms.schema.NumberNode.create({
        label: props.maxLabel || _('Maximum')
      }),
    });

    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super(value, childrenValidation);
    if (error) {
      return error;
    }

    if (value.has('min') && value.has('max')) {
      if (value.get('min') >= value.get('max')) {
        return new Error(_('The minimum must be less than the maximum'));
      }
    }
  }
}


module.exports = NumericRange;

