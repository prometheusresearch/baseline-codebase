/**
 * @jsx React.DOM
 */
'use strict';

var React                  = require('react');
var HotkeyEnumerationWidgetMixin = require('./HotkeyEnumerationWidgetMixin');
var ItemLabel              = require('../ItemLabel');
var ensureInView           = require('../../utils').ensureInView;

var checkGroup = React.createClass({
  mixins: [
    HotkeyEnumerationWidgetMixin
  ],

  className: 'rex-forms-checkGroup',

  renderInput: function() {
    return (
      <div tabIndex={0} onKeyPress={this.onKeyPress} onKeyDown={this.onKeyDown}>
        {this.getEnumerations().map(this.renderEnumeration)}
      </div>
    );
  },

  /**
   * Render enumeration descriptor
   *
   * @param {Descriptor} enumeration
   */
  renderEnumeration: function(enumeration) {
    var value = this.getValue();
    var checked = value && value.indexOf(enumeration.id) >= 0;
    var hotkey = String.fromCharCode(this.hotkeyForEnumeration(enumeration));
    return (
      <div className="rex-forms-checkGroup__option" key={enumeration.id}>
        <label>
          <input
            checked={checked}
            disabled={this.props.disabled}
            type="checkbox"
            name={this.getInputName()}
            onChange={this.onChangeCheck}
            value={enumeration.id}
            onFocus={this.onFocusCheck}
            />
          {this.hotkeysEnabled() &&
            <ItemLabel
              label={hotkey}
              className="rex-forms-checkGroup__hotkey"
              />
          }
          <ItemLabel
            className="rex-forms-checkGroup__optionLabel"
            label={enumeration.text}
            help={enumeration.help}
            audio={enumeration.audio}
            />
        </label>
      </div>
    );
  },

  onChangeCheck: function(e) {
    var nextValue = (this.getValue() || []).slice(0);

    if (e.target.checked) {
      nextValue.push(e.target.value);
    } else {
      var idx = nextValue.indexOf(e.target.value);
      if (idx > -1) {
        nextValue.splice(idx, 1);
      }
    }

    this.onChange(nextValue);
  },

  onFocusCheck: function() {
    ensureInView(this.getDOMNode());
  },

  onHotkey: function (enumeration) {
    var nextValue = (this.getValue() || []).slice(0);
    var idx = nextValue.indexOf(enumeration.id);
    if (idx === -1) {
      nextValue.push(enumeration.id);
    } else {
      nextValue.splice(idx, 1);
    }
    this.onChange(nextValue);
  },

  onKeyDown: function(e) {
    if (e.key === 'Tab') {
      e.stopPropagation();
      this.next();
    }
  }
});

module.exports = checkGroup;

