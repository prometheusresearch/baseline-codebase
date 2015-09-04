/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map, OrderedMap} = require('immutable');

var {isEmpty} = require('../util');
var i18n = require('../i18n');
var _ = i18n.gettext;


class AudioSource extends ReactForms.schema.MappingNode {
  static create(props) {
    /*eslint new-cap:0 */
    props = props || {};

    var children = {};
    children[i18n.getRex().config.locale] = ReactForms.schema.ListNode.create({
      label: props.label,
      required: props.required || false,
      children: ReactForms.schema.Scalar()
    });
    props.children = OrderedMap(children);

    delete props.label;

    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    value = value.get(i18n.getRex().config.locale);

    if (
        this.props.get('required')
        && ((value === undefined) || (value.count() < 1))) {
      return new Error(_('At least one URL is required.'));
    }

    if (value) {
      for (var i = 0; i < value.count(); i++) {
        if (isEmpty(value.get(i))) {
          return new Error(_('You must specify a URL in each field.'));
        }
      }
    }
  }
}


module.exports = AudioSource;

