/**
 * @flow
 */

import * as React from 'react';
import specialAssign from './specialAssign';

const IGNORE_PROPS = {
  children: true,
  disabled: true,
  tag: true,
};

export default class Button extends React.Component {
  props: {
    children?: React.Element<*>,
    tag: Function | string,
    disabled: boolean,
  };

  static contextTypes = {
    ambManager: React.PropTypes.object.isRequired,
  };

  static defaultProps = {
    tag: 'span',
  };

  componentWillMount() {
    this.context.ambManager.button = this;
  }

  componentWillUnmount() {
    this.context.ambManager.destroy();
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (this.props.disabled) return;

    let ambManager = this.context.ambManager;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!ambManager.isOpen) {
          ambManager.openMenu({focusMenu: true});
        } else {
          ambManager.focusItem(0);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        ambManager.toggleMenu();
        break;
      case 'Escape':
        ambManager.handleMenuKey(event);
        break;
      default:
        // (Potential) letter keys
        ambManager.handleButtonNonArrowKey(event);
    }
  };

  handleClick = () => {
    if (this.props.disabled) return;
    this.context.ambManager.toggleMenu();
  };

  render() {
    let props = this.props;

    let buttonProps = {
      // "The menu button itself has a role of button."
      role: 'button',
      tabIndex: props.disabled ? '' : '0',
      // "The menu button has an aria-haspopup property, set to true."
      'aria-haspopup': true,
      'aria-expanded': this.context.ambManager.isOpen,
      'aria-disabled': props.disabled,
      onKeyDown: this.handleKeyDown,
      onClick: this.handleClick,
      onBlur: this.context.ambManager.handleBlur,
    };

    specialAssign(buttonProps, props, IGNORE_PROPS);

    return React.createElement(props.tag, buttonProps, props.children);
  }
}
