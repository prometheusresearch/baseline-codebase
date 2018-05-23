/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import forEach from 'lodash/forEach';
import noop from 'lodash/noop';

export class HotkeyHandler extends React.Component {

  static defaultProps = {
    onKey: noop,
    onTab: noop,
    onEnter: noop,
    onEscape: noop,
  };

  render() {
    let {keys, children} = this.props;
    return (
      <div onKeyPress={keys && this.onKeyPress} onKeyDown={this.onKeyDown}>
        {children}
      </div>
    );
  }

  onKeyPress = e => {
    if (this.props.keys[e.key]) {
      e.preventDefault();
      this.props.onKey(this.props.keys[e.key], e);
    }
  };

  onKeyDown = e => {
    if (e.key === 'Tab') {
      this.props.onTab(e);
    } else if (e.key === 'Enter') {
      this.props.onEnter(e);
    } else if (e.key === 'Escape') {
      this.props.onEscape(e);
    }
  };
}

export function EditHotKeyHandler({
  onCommitEdit,
  onCancelEdit,
  editable,
  children,
  ...props
}) {
  if (editable) {
    return (
      <HotkeyHandler {...props}
        onEnter={onCommitEdit}
        onEscape={onCancelEdit}>
        {children}
      </HotkeyHandler>
    );
  } else {
    return React.Children.only(children);
  }
}

let ALLOWED_HOTKEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export function hotkeysFromOptions(enumerations, options = {}) {
  let hotkeys = {};
  let config = options.hotkeys || {};

  if (options.autoHotkeys || (Object.keys(config).length > 0)) {
    let defaults = ALLOWED_HOTKEYS.slice().filter((defaultHotkey) => {
      // Remove from the list of defaults any hotkeys that have been
      // configured for use on a specific enumeration.
      let keys = Object.keys(config);
      for (let i = 0; i < keys.length; i++) {
        if (String(config[keys[i]]) === defaultHotkey) {
          return false;
        }
      }
      return true;
    });

    enumerations.forEach((enumeration) => {
      let hotkey;

      if (config[enumeration.value] !== undefined) {
        hotkey = String(config[enumeration.value]);
        if (ALLOWED_HOTKEYS.indexOf(hotkey) < 0) {
          hotkey = defaults.shift();
        }
      } else {
        hotkey = defaults.shift();
      }

      hotkeys[enumeration.value] = hotkey;
    });
  }

  return hotkeys;
}

export function configureHotkeys(hotkeys) {
  let keys = {};
  forEach(hotkeys, (key, value) => {
    keys[key] = {key, value};
  });
  return keys;
}

