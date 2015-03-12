/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map} = require('immutable');

var Enumeration = require('./Enumeration');
var RepeatingEnumerationFieldset = require('./form/RepeatingEnumeration');
var _ = require('../i18n').gettext;


class EnumerationList extends ReactForms.schema.ListNode {
  static create(props) {
    props = props || {}
    props.children = Enumeration.create();
    props.component = RepeatingEnumerationFieldset;
    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super(value, childrenValidation);
    if (error) {
      return error;
    }

    if (value.size < 1) {
      return new Error(_('You must specify at least one enumeration.'));
    }

    var ids = [];
    for (var i = 0; i < value.size; i++) {
      var id = value.get(i).get('id');
      if (ids.indexOf(id) > -1) {
        return new Error(_('Every enumeration must have a unique identifier.'));
      }
      ids.push(id);
    }
  }
};


module.exports = EnumerationList;

