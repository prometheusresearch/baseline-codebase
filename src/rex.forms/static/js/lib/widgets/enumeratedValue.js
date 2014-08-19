/**
 * @jsx React.DOM
 */
'use strict';

var React               = require('react');
var ReactForms          = require('react-forms');
var LabelRenderingMixin = require('./LabelRenderingMixin');
var EnumerationMixin    = require('./EnumerationMixin');
var localization        = require('../localization');
var _ = localization._;


var enumeratedValue = React.createClass({
  mixins: [
    ReactForms.FieldMixin,
    LabelRenderingMixin,
    EnumerationMixin,
    localization.LocalizedMixin
  ],

  render: function() {
    var value = this.value().value;
    if (value === null) {
      value = [];
    } else if (!Array.isArray(value)) {
      value = [value];
    }
    var hasValue = (value.length > 0);

    var enumerations = this.getEnumerations();
    var choices = value.map((choice) => {
      var enums = enumerations.filter((e) => {
        return e.id === String(choice);
      });

      return (
        <span key={choice} className="rex-forms-value__choice">
          {this.localize(enums[0].text)}
        </span>
      );
    });

    return (
      <div className="rex-forms-value">
        {this.renderLabel()}
        <div>
          {hasValue ? choices :
            <span className="rex-forms-value__novalue">
              {_('No value provided.')}
            </span>}
        </div>
      </div>
    );
  }
});

module.exports = enumeratedValue;
