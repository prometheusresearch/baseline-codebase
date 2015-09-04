/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ChoiceProperty = require('./ChoiceProperty');
var _ = require('../i18n').gettext;


class RequiredOptional extends ChoiceProperty {
  static create(props) {
    props = props || {};
    props.choices = [
      {value: 'required', label: _('Required')},
      {value: 'optional', label: _('Optional')},
      {value: 'none', label: _('None')}
    ];

    return super.create(props);
  }
}


module.exports = RequiredOptional;

