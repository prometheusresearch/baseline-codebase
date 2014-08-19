/**
 * @jsx React.DOM
 */
'use strict';

var FormEventsMixin           = require('../form/FormEventsMixin');
var defaultBooleanEnumeration = require('./defaultBooleanEnumeration');

var EnumerationMixin = {
  mixins: [
    FormEventsMixin
  ],

  getEnumerations: function() {
    var enumerations = (
      this.props.options.enumerations
      || defaultBooleanEnumeration
    );

    var name = this.context.value.schema.name || this.props.name;

    var isHidden = this.formEvents() ?
      this.formEvents().isEnumerationHidden.bind(null, name)
      : function () { return false; };
    return enumerations.filter((enumeration) => !isHidden(enumeration.id));
  }
};

module.exports = EnumerationMixin;
