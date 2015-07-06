/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map, OrderedMap} = require('immutable');

var Fieldset = require('./form/Fieldset');
var _ = require('../i18n').gettext;


class RangedProperty extends ReactForms.schema.MappingNode {
  static create(props) {
    props = props || {};

    props.component = Fieldset;

    var scalarType = props.scalarType;
    delete props.scalarType;

    /*eslint new-cap:0 */
    props.children = OrderedMap({
      min: scalarType.create({
        label: props.minLabel || _('Minimum')
      }),
      max: scalarType.create({
        label: props.maxLabel || _('Maximum')
      })
    });

    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    if (value.has('min') && value.has('max')) {
      var min = value.get('min');
      var max = value.get('max');
      if ((min !== null) && (max !== null) && (min >= max)) {
        return new Error(_('The minimum must be less than the maximum'));
      }
    }
  }
}


module.exports = RangedProperty;

