/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms-old');
var {Map} = require('immutable');

var Row = require('./Row');
var RepeatingRowFieldset = require('./form/RepeatingRow');
var _ = require('../i18n').gettext;


class RowList extends ReactForms.schema.ListNode {
  static create(props) {
    props = props || {};
    props.children = Row.create();
    props.component = RepeatingRowFieldset;

    /*eslint new-cap:0 */
    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    if (value.size < 1) {
      return new Error(_('You must specify at least one row.'));
    }

    var ids = [];
    for (var i = 0; i < value.count(); i++) {
      var id = value.get(i).get('id');
      if (ids.indexOf(id) > -1) {
        return new Error(_('Every row must have a unique identifier.'));
      }
      ids.push(id);
    }
  }
}


module.exports = RowList;

