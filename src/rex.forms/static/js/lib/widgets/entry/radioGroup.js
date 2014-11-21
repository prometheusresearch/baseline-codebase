/**
 * @jsx React.DOM
 */
'use strict';

var React                  = require('react');
var HotkeyEnumerationWidgetMixin = require('./HotkeyEnumerationWidgetMixin');
var ItemLabel              = require('../ItemLabel');
var ensureInView           = require('../../utils').ensureInView;
var _                      = require('../../localization')._;


var radioGroup = React.createClass({
  mixins: [
    HotkeyEnumerationWidgetMixin
  ],

  className: 'rex-forms-radioGroup',

  renderInput: function() {
    var value = this.getValue();

    var contents = this.getEnumerations().map(this.renderEnumeration);
    if (value && !this.props.disabled) {
      contents.push((
        <div className="rex-forms-radioGroup__clear" key="clear-all">
          <a href="#" onClick={this.onClearSelection}>
            {_('Clear My Selection')}
          </a>
        </div>
      ));
    }

    return (
      <div
        tabIndex={0}
        className="rex-forms-radioGroup__input"
        onKeyPress={this.onKeyPress}>
        {contents}
      </div>
    );
  },

  /**
   * Render enumeration descriptor
   *
   * @param {Descriptor} enumeration
   */
  renderEnumeration: function(enumeration) {
    var hotkey = String.fromCharCode(this.hotkeyForEnumeration(enumeration));
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
          {this.hotkeysEnabled() &&
            <ItemLabel
              label={hotkey}
              className="rex-forms-radioGroup__hotkey"
              />
          }
          <ItemLabel
            className="rex-forms-radioGroup__optionLabel"
            label={enumeration.text}
            help={enumeration.help}
            />
        </label>
      </div>
    );
  },

  onHotkey: function (enumeration) {
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

