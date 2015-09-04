/**
 * @jsx React.DOM
 */
'use strict';

var React                  = require('react');
var cx                     = React.addons.classSet;
var HotkeyEnumerationWidgetMixin = require('./HotkeyEnumerationWidgetMixin');
var ItemLabel              = require('./ItemLabel');
var ensureInView           = require('../utils').ensureInView;
var _                      = require('../localization')._;

var radioGroup = React.createClass({
  mixins: [
    HotkeyEnumerationWidgetMixin
  ],

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

  onHotkey: function (enumeration) {
    this.onChange(enumeration.id);
    this.next();
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
          <div className="rex-forms-radioGroup__input">
            <input
              checked={this.getValue() === enumeration.id}
              disabled={this.props.disabled}
              type="radio"
              name={this.getInputName()}
              onChange={this.onChange.bind(null, enumeration.id)}
              onFocus={this.onFocus}
              value={enumeration.id}
              />
          </div>
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
            audio={enumeration.audio}
            />
        </label>
      </div>
    );
  },

  renderInput: function() {
    var value = this.getValue();

    var classes = cx({
      'rex-forms-radioGroup': true,
      'rex-forms-radioGroup--horizontal': this.getWidgetOptions().orientation === 'horizontal'
    });

    return (
      <div
        tabIndex={0}
        onKeyPress={this.onKeyPress}
        className={classes}>
        <div className="rex-forms-radioGroup__container">
          {this.getEnumerations().map(this.renderEnumeration)}
        </div>
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
