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
    var enumerations = this.props.options.enumerations;
    if (!enumerations) {
      var instrumentType = this.context.value.schema.children.value.props.instrumentType;
      if (instrumentType.rootType === 'boolean') {
        enumerations = defaultBooleanEnumeration;
      } else if (instrumentType.enumerations) {
        enumerations = Object.keys(instrumentType.enumerations).sort().map((id) => {
          return {
            id: id,
            text: id
          };
        });
      }
    }

    var name = this.context.value.schema.name || this.props.name;

    var isHidden = this.formEvents() ?
      this.formEvents().isEnumerationHidden.bind(null, name)
      : function () { return false; };
    return enumerations.filter((enumeration) => !isHidden(enumeration.id));
  }
};

module.exports = EnumerationMixin;
