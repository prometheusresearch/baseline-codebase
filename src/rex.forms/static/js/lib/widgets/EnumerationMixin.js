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
      var instrumentType;
      if (this.context.value.schema.children.value) {
        instrumentType = this.context.value.schema.children.value.props.instrumentType;
      } else {
        instrumentType = this.context.value.schema.children[this.props.name].props.instrumentType;
      }

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

    var isHidden;
    var events = this.formEvents();
    if (events) {
      var localValue = this.value();

      // HACK
      if (localValue.path.length === 5) {
        // This enumeration is embedded in a matrix or recordList, so, we want
        // the value of the record/row we're contained in.
        localValue = localValue.parent.parent;
      } else {
        localValue = null;
      }

      isHidden = (enumId) => {
        return events.isEnumerationHidden(name, enumId, localValue);
      };
    } else {
      isHidden = function () {
        return false;
      };
    }

    return enumerations.filter((enumeration) => !isHidden(enumeration.id));
  }
};

module.exports = EnumerationMixin;
