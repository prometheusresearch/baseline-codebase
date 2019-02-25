/**
 * @flow
 */

import createFocusGroup from 'focus-group';
import findHTMLElement from '../findHTMLElement';
import * as externalStateControl from './externalStateControl';

const focusGroupOptions = {
  wrap: true,
  stringSearch: true,
};

type ManagerOptions = {
  id?: string,
  wrap?: boolean,
  stringSearch?: boolean,
  closeOnSelection?: boolean,
  onMenuToggle: ({isOpen: boolean}) => *,
  onSelection: Function,
};

type FocusGroup = any;
type Item = any;

export class Manager {
  options: ManagerOptions;
  focusGroup: FocusGroup;
  button: any;
  menu: any;
  isOpen: boolean;
  moveFocusTimer: ?number = null;
  blurTimer: ?number = null;

  constructor(options: ManagerOptions) {
    this.options = options || {};

    if (typeof this.options.closeOnSelection === 'undefined') {
      this.options.closeOnSelection = true;
    }

    if (this.options.id) {
      externalStateControl.registerManager(this.options.id, this);
    }

    // "With focus on the drop-down menu, the Up and Down Arrow
    // keys move focus within the menu items, "wrapping" at the top and bottom."
    // "Typing a letter (printable character) key moves focus to the next
    // instance of a visible node whose title begins with that printable letter."
    //
    // All of the above is handled by focus-group.
    this.focusGroup = createFocusGroup(focusGroupOptions);

    // These component references are added when the relevant components mount
    this.button = null;
    this.menu = null;

    // State trackers
    this.isOpen = false;
  }

  focusItem(index: number) {
    this.focusGroup.focusNodeAtIndex(index);
  }

  addItem(item: Item) {
    this.focusGroup.addMember(item);
  }

  clearItems() {
    this.focusGroup.clearMembers();
  }

  handleButtonNonArrowKey(event: KeyboardEvent) {
    this.focusGroup._handleUnboundKey(event);
  }

  destroy() {
    this.button = null;
    this.menu = null;
    this.focusGroup.deactivate();
    clearTimeout(this.blurTimer);
    clearTimeout(this.moveFocusTimer);
  }

  update() {
    this.menu.setState({isOpen: this.isOpen});
    this.button.setState({menuOpen: this.isOpen});
    this.options.onMenuToggle && this.options.onMenuToggle({isOpen: this.isOpen});
  }

  openMenu(openOptions: any) {
    if (this.isOpen) return;
    openOptions = openOptions || {};
    this.isOpen = true;
    this.update();
    this.focusGroup.activate();
    if (openOptions.focusMenu) {
      this.moveFocusTimer = setTimeout(
        () => {
          this.focusItem(0);
        },
        0,
      );
    }
  }

  closeMenu(closeOptions: any) {
    if (!this.isOpen) return;
    closeOptions = closeOptions || {};
    this.isOpen = false;
    this.update();
    if (closeOptions.focusButton) {
      const elem = findHTMLElement(this.button);
      if (elem != null) {
        elem.focus();
      }
    }
  }

  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  handleBlur = () => {
    this.blurTimer = setTimeout(
      () => {
        const buttonNode = findHTMLElement(this.button);
        const menuNode = findHTMLElement(this.menu);
        if (buttonNode != null) {
          let activeEl = buttonNode.ownerDocument.activeElement;
          if (activeEl === buttonNode) {
            return;
          }
          if (menuNode != null && menuNode.contains(activeEl)) {
            return;
          }
          if (this.isOpen) {
            this.closeMenu({focusButton: false});
          }
        }
      },
      0,
    );
  };

  handleSelection = (value: any, event: any) => {
    if (this.options.closeOnSelection) this.closeMenu({focusButton: true});
    this.options.onSelection(value, event);
  };

  handleMenuKey = (event: KeyboardEvent) => {
    // "With focus on the drop-down menu, pressing Escape closes
    // the menu and returns focus to the button.
    if (this.isOpen && event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu({focusButton: true});
    }
  };
}

export default function createManager(options: ManagerOptions) {
  return new Manager(options);
}
