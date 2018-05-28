/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map, OrderedMap} = require('immutable');

var Fieldset = require('./form/Fieldset');
var Hotkey = require('./Hotkey');
var _ = require('../i18n').gettext;


class BooleanHotkeys extends ReactForms.schema.MappingNode {
  static create(props) {
    /*eslint new-cap:0 */

    props = props || {};
    props.component = Fieldset;

    var children = {
      yes: Hotkey.create({
        label: _('True/Yes')
      }),

      no: Hotkey.create({
        label: _('False/No')
      })
    };

    props.children = OrderedMap(children);

    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    var yes = value.get('yes'), no = value.get('no');
    if ((yes && no) && (yes === no)) {
      return new Error(
        _('You must set different hotkeys for the two values.')
      );
    }
  }
}


module.exports = BooleanHotkeys;

