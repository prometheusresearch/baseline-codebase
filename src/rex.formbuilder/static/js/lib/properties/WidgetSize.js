/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ChoiceProperty = require('./ChoiceProperty');
var _ = require('../i18n').gettext;


class WidgetSize extends ChoiceProperty {
  static create(props) {
    props = props || {};
    props.choices = [
      {value: 'small', label: _('Small')},
      {value: 'medium', label: _('Medium')},
      {value: 'large', label: _('Large')}
    ];

    return super.create(props);
  }
}


module.exports = WidgetSize;

