/**
 * @jsx React.DOM
 */
'use strict';

var EnumerationWidgetMixin = require('./EnumerationWidgetMixin');


var ALLOWED_HOTKEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

var HotkeyEnumerationWidgetMixin = {
  mixins: [
    EnumerationWidgetMixin
  ],

  getInitialState: function () {
    return {
      hotkeys: {}
    };
  },

  componentWillMount: function () {
    this.establishHotkeys(this.props);
  },

  componentWillReceiveProps: function (nextProps) {
    this.establishHotkeys(nextProps);
  },

  establishHotkeys: function (props) {
    var widgetConfig = this.getWidgetOptions(props);
    var config = widgetConfig.hotkeys || {};
    var enumerations = this.getEnumerations(true);
    var hotkeys = {};

    if (widgetConfig.autoHotkeys || (Object.keys(config).length > 0)) {
      var defaults = ALLOWED_HOTKEYS.slice().filter((defaultHotkey) => {
        // Remove from the list of defaults any hotkeys that have been
        // configured for use on a specific enumeration.
        var keys = Object.keys(config);
        for (var i = 0; i < keys.length; i++) {
          if (String(config[keys[i]]) === defaultHotkey) {
            return false;
          }
        }
        return true;
      });

      enumerations.forEach((enumeration) => {
        var hotkey;

        if (config[enumeration.id] !== undefined) {
          hotkey = String(config[enumeration.id]);
          if (ALLOWED_HOTKEYS.indexOf(hotkey) < 0) {
            hotkey = defaults.shift();
          }
        } else {
          hotkey = defaults.shift();
        }

        hotkeys[enumeration.id] = hotkey ? hotkey.charCodeAt(0) : undefined;
      });
    }

    this.setState({
      hotkeys: hotkeys
    });
  },

  hotkeysEnabled: function () {
    var numHotkeys = Object.keys(this.state.hotkeys).length;
    return ((numHotkeys > 0) && (numHotkeys <= 10));
  },

  hotkeyForEnumeration: function (enumeration) {
    return this.state.hotkeys[enumeration.id];
  },

  enumerationForHotkey: function (hotkey) {
    var enumerations = this.getEnumerations(true);
    for (var i = 0; i < enumerations.length; i++) {
      if (this.state.hotkeys[enumerations[i].id] === hotkey) {
        return enumerations[i];
      }
    }
  },

  onKeyPress: function (event) {
    if (!this.hotkeysEnabled()) {
      return;
    }

    var enumeration = this.enumerationForHotkey(event.charCode);
    if (enumeration && this.onHotkey) {
      this.onHotkey(enumeration);
    }
  }
};


module.exports = HotkeyEnumerationWidgetMixin;

