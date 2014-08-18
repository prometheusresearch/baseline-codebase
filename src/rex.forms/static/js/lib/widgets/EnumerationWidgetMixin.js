/**
 * @jsx React.DOM
 */
'use strict';

var FormEventsMixin           = require('../form/FormEventsMixin');
var WidgetMixin               = require('./WidgetMixin');
var defaultBooleanEnumeration = require('./defaultBooleanEnumeration');

var EnumerationWidgetMixin = {
  mixins: [WidgetMixin, FormEventsMixin],

  getEnumerations: function() {
    var enumerations = (
      this.props.options.enumerations
      || defaultBooleanEnumeration
    );

    var isHidden = this.formEvents() ?
      this.formEvents().isEnumerationHidden.bind(null, this.getName())
      : function () { return false; };
    return enumerations.filter((enumeration) => !isHidden(enumeration.id));
  }
};

module.exports = EnumerationWidgetMixin;
