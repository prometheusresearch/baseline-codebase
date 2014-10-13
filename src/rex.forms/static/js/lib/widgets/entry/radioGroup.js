/**
 * @jsx React.DOM
 */
'use strict';

var React                  = require('react');
var EnumerationWidgetMixin = require('../EnumerationWidgetMixin');
var ItemLabel              = require('../ItemLabel');
var ensureInView           = require('../../utils').ensureInView;
var _                      = require('../../localization')._;

var radioGroup = React.createClass({
  mixins: [EnumerationWidgetMixin],

  className: 'rex-forms-radioGroup',

  renderInput: function() {
    var value = this.getValue();

    return (
      <div tabIndex={0} className="rex-forms-radioGroup__input" onKeyPress={this.onKeyPress}>
        {this.getEnumerations().map(this.renderEnumeration)}
        {value && !this.props.disabled &&
          <div className="rex-forms-radioGroup__clear">
            <a href="#" onClick={this.onClearSelection}>
              {_('Clear My Selection')}
            </a>
          </div>}
      </div>
    );
  },

  /**
   * Render enumeration descriptor
   *
   * @param {Descriptor} enumeration
   */
  renderEnumeration: function(enumeration, idx) {
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
            formatter={function(label) { return `[${idx + 1}] ${label}`; }}
            className="rex-forms-radioGroup__optionLabel"
            label={enumeration.text}
            help={enumeration.help}
            />
        </label>
      </div>
    );
  },

  onKeyPress: function(e) {
    var key = e.charCode - 48;
    if (key < 1 || key > 9) {
      return;
    }
    var enumerations = this.getEnumerations();
    if (key > enumerations.length) {
      return;
    }
    var enumeration = enumerations[key - 1];
    this.onChange(enumeration.id);
    this.next();
  },

  onFocus: function() {
    ensureInView(this.getDOMNode());
  },

  onClearSelection: function (event) {
    event.preventDefault();
    var value = this.value().updateValue(null);
    this.onValueUpdate(value);
    if (this.props.onChange) {
      this.props.onChange(event);
    }
  }
});

module.exports = radioGroup;

