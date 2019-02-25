/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms-old');
var {Map} = require('immutable');

var Enumeration = require('./Enumeration');
var RepeatingEnumerationFieldset = require('./form/RepeatingEnumeration');
var _ = require('../i18n').gettext;


class EnumerationList extends ReactForms.schema.ListNode {
  static create(props) {
    props = props || {};
    props.children = Enumeration.create({
      simple: props.simpleEnumerations || false
    });
    props.component = RepeatingEnumerationFieldset;

    /*eslint new-cap:0 */
    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    if (value.size < 1) {
      return new Error(_('You must specify at least one enumeration.'));
    }

    var ids = [];
    var hotkeys = [];
    for (var i = 0; i < value.count(); i++) {
      var id = value.get(i).get('id');
      if (ids.indexOf(id) > -1) {
        return new Error(_('Every enumeration must have a unique identifier.'));
      }
      ids.push(id);

      var hotkey = value.get(i).get('hotkey');
      if (hotkey) {
        if (hotkeys.indexOf(hotkey) > -1) {
          return new Error(_('Hotkeys must be unique.'));
        }
        hotkeys.push(hotkey);
      }
    }
  }
}


module.exports = EnumerationList;

