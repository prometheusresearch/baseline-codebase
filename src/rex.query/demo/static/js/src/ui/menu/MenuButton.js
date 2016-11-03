/**
 * @flow
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';
import IconEllipsis from 'react-icons/lib/fa/ellipsis-v';

type MenuButtonProps = {
  icon?: ?string | React$Element<*>;
  selected?: boolean;
  onIconClick?: (ev: MouseEvent) => *;
  tabIndex?: number;
  menu?: React$Element<*>;
  children?: React$Element<*>;
  buttonGroup?: ?React$Element<*>;
};

type MenuButtonState = {
  menuOpen: boolean;
};

export default class MenuButton extends React.Component<*, MenuButtonProps, *> {

  state: MenuButtonState  = {
    menuOpen: false,
  }

  menuButtonMenu: ?HTMLElement = null;
  menuButtonMenuToggle: ?HTMLElement = null;
  mounted: boolean = true;

  toggleMenuOpen = () => {
    if (this.state.menuOpen) {
      this.setState(state => ({...state, menuOpen: false}));
    } else {
      this.setState(state => ({...state, menuOpen: true}));
    }
  };

  maybeCloseMenu = (ev: MouseEvent) => {
    let target = ev.target;
    do {
      if (
        (this.menuButtonMenu != null && this.menuButtonMenu === target) ||
        (this.menuButtonMenuToggle != null && this.menuButtonMenuToggle === target)
      ) {
        return;
      }
      // $FlowFixMe: how?
      target = target.parentNode;
    } while (target != null);
    if (this.mounted) {
      this.setState(state => ({...state, menuOpen: false}));
    }
  }

  onMenuButtonMenu = (menuButtonMenu: HTMLElement) => {
    this.menuButtonMenu = menuButtonMenu
      ? ReactDOM.findDOMNode(menuButtonMenu)
      : null;
  };

  onMenuButtonMenuToggle = (menuButtonMenuToggle: HTMLElement) => {
    this.menuButtonMenuToggle = menuButtonMenuToggle
      ? ReactDOM.findDOMNode(menuButtonMenuToggle)
      : null;
  };

  render() {
    let {
      icon,
      menu,
      selected,
      children,
      buttonGroup,
      onIconClick,
      tabIndex = 0,
      ...rest
    } = this.props;
    let {
      menuOpen,
    } = this.state;
    return (
      <MenuButtonRoot {...rest} variant={{selected}} tabIndex={tabIndex}>
        <HBox>
          <MenuButtonWrapper>
            <VBox
              onClick={onIconClick}
              width={15}
              paddingRight={20}
              justifyContent="flex-start">
              {icon}
            </VBox>
            {children}
          </MenuButtonWrapper>
          {buttonGroup}
          {menu &&
            <MenuButtonMenuToggle
              ref={this.onMenuButtonMenuToggle}
              onClick={this.toggleMenuOpen}
              />}
        </HBox>
        {menuOpen && menu &&
          <MenuButtonMenu ref={this.onMenuButtonMenu}>
            {menu}
          </MenuButtonMenu>}
      </MenuButtonRoot>
    );
  }

  componentDidUpdate(_prevProps: MenuButtonProps, prevState: MenuButtonState) {
    if (this.state.menuOpen && !prevState.menuOpen) {
      window.addEventListener('click', this.maybeCloseMenu, {capture: true});
    } else if (this.state.menuOpen && !prevState.menuOpen) {
      window.removeEventListener('click', this.maybeCloseMenu);
    }
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
    window.removeEventListener('click', this.maybeCloseMenu);
  }
}

class MenuButtonMenuToggle extends React.Component {

  props: {
    onClick: () => *;
  };

  onClick = (ev: UIEvent) => {
    ev.stopPropagation();
    this.props.onClick();
  };

  render() {
    return (
      <MenuButtonMenuToggleRoot onClick={this.onClick}>
        <IconEllipsis />
      </MenuButtonMenuToggleRoot>
    );
  }
}

let MenuButtonMenuToggleRoot = style(VBox, {
  displayName: 'MenuButtonMenuToggleRoot',
  base: {
    justifyContent: 'center',
    padding: 8,
    color: '#888',
    hover: {
      color: '#222',
      background: '#fafafa',
    },
  }
});

let MenuButtonRoot = style(VBox, {
  displayName: 'MenuButtonRoot',
  base: {
    outline: css.none,
    cursor: 'default',
    fontSize: '10pt',
    fontWeight: 200,
    borderBottom: css.border(1, '#ddd'),
    userSelect: 'none',
  },
  selected: {
    color: '#1f85f5',
  },
});

let MenuButtonMenu = style(VBox, {
  displayName: 'MenuButtonMenu',
  base: {
    borderTop: css.border(1, '#bbb'),
  }
});

let MenuButtonWrapper = style(HBox, {
  displayName: 'MenuButtonWrapper',
  base: {
    flexGrow: 1,
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    hover: {
      background: '#fafafa',
    }
  }
});
