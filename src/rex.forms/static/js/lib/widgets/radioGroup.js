/**
 * @jsx React.DOM
 */
'use strict';

var React                  = require('react');
var EnumerationWidgetMixin = require('./EnumerationWidgetMixin');
var ItemLabel              = require('./ItemLabel');

var radioGroup = React.createClass({
  mixins: [EnumerationWidgetMixin],

  className: 'rex-forms-radioGroup',

  onFocus: function () {
    this.getDOMNode().scrollIntoView(false);
  },

  /**
   * Render enumeration descriptor
   *
   * @param {Descriptor} enumeration
   */
  renderEnumeration: function(enumeration) {
    return (
      <div className="rex-forms-radioGroup__option" key={enumeration.id}>
        <label>
          <input
            checked={this.getValue() === enumeration.id}
            type="radio"
            name={this.getInputName()}
            onChange={this.onChange.bind(null, enumeration.id)}
            onFocus={this.onFocus}
            value={enumeration.id}
            />
          <ItemLabel
            className="rex-forms-radioGroup__optionLabel"
            label={enumeration.text}
            help={enumeration.help}
            />
        </label>
      </div>
    );
  },

  renderInput: function() {
    return (
      <div className="rex-forms-radioGroup">
        {this.getEnumerations().map(this.renderEnumeration)}
      </div>
    );
  }
});

module.exports = radioGroup;
