/**
 * @jsx React.DOM
 */
'use strict';

var React                  = require('react');
var EnumerationWidgetMixin = require('./EnumerationWidgetMixin');
var ItemLabel              = require('./ItemLabel');
var ensureInView           = require('../utils').ensureInView;
var _                      = require('../localization')._;

var radioGroup = React.createClass({
  mixins: [EnumerationWidgetMixin],

  className: 'rex-forms-radioGroup',

  onFocus: function () {
    ensureInView(this.getDOMNode());
  },

  onClearSelection: function (event) {
    event.preventDefault();
    var value = this.value().updateValue(null);
    this.onValueUpdate(value);
    if (this.props.onChange) {
      this.props.onChange(event);
    }
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
            disabled={this.props.disabled}
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
    var value = this.getValue();

    return (
      <div className="rex-forms-radioGroup">
        {this.getEnumerations().map(this.renderEnumeration)}
        {value && !this.props.disabled &&
          <div className="rex-forms-radioGroup__clear">
            <a href="#" onClick={this.onClearSelection}>
              {_('Clear My Selection')}
            </a>
          </div>}
      </div>
    );
  }
});

module.exports = radioGroup;
