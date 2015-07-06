/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var objectPath = require('object-path');

var Enumeration = require('./Enumeration');
var _ = require('../../i18n').gettext;


class DropDownMenu extends Enumeration {
  static getName() {
    return _('DropDown Menu');
  }

  static getTypeID() {
    return 'question-dropdown';
  }

  serialize(instrument, form, context) {
    context = context || this;

    /*eslint no-redeclare:0 */
    var {instrument, form} = super.serialize(instrument, form, context);

    var field = context.getCurrentSerializationField(instrument);
    objectPath.set(field, 'type.base', 'enumeration');

    var elm = context.getCurrentSerializationElement(form);
    objectPath.set(elm, 'options.widget.type', 'dropDown');

    return {
      instrument,
      form
    };
  }
}


Enumeration.registerElement(
  DropDownMenu,
  function (element, instrument, field) {
    if (field.type.rootType === 'enumeration') {
      var widget = objectPath.get(element, 'options.widget.type');
      if (widget === 'dropDown') {
        var elm = new DropDownMenu();
        elm.parse(element, instrument, field);
        return elm;
      }
    }
  }
);


module.exports = DropDownMenu;

