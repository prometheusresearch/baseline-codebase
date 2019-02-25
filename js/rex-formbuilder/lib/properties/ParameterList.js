/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms-old');
var {Map} = require('immutable');

var Parameter = require('./Parameter');
var RepeatingParameterFieldset = require('./form/RepeatingParameter');
var _ = require('../i18n').gettext;


class ParameterList extends ReactForms.schema.ListNode {
  static create(props) {
    props = props || {};
    props.children = Parameter.create({});
    props.component = RepeatingParameterFieldset;

    /*eslint new-cap:0 */
    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    var ids = [];
    var hotkeys = [];
    for (var i = 0; i < value.count(); i++) {
      var id = value.get(i).get('id');
      if (ids.indexOf(id) > -1) {
        return new Error(_('Every parameter must have a unique identifier.'));
      }
      ids.push(id);
    }
  }
}


module.exports = ParameterList;

