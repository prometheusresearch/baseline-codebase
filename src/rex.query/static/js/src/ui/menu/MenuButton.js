/**
 * @flow
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {style, css, VBox, HBox} from 'react-stylesheet';
import * as Icon from '../Icon';

type MenuButtonProps = {
  icon?: ?string | React$Element<*>,
  selected?: boolean,
  disabled?: boolean,
  onIconClick?: (ev: MouseEvent) => *,
  iconTitle?: string,
  tabIndex?: number,
  menu?: React$Element<*>,
  children?: React$Element<*>,
  buttonGroup?: ?React$Element<*>,
};

type MenuButtonState = {
  menuOpen: boolean,
};

export default class MenuButton extends React.Component<*, MenuButtonProps, *> {
  state: MenuButtonState = {
    menuOpen: false,
  };

  menuButtonMenu: ?React.Component<*, *, *> = null;
  menuButtonMenuToggle: ?React.Component<*, *, *> = null;
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
        (this.menuButtonMenu != null &&
          ReactDOM.findDOMNode(this.menuButtonMenu) === target) ||
        (this.menuButtonMenuToggle != null &&
          ReactDOM.findDOMNode(this.menuButtonMenuToggle) === target)
      ) {
        return;
      }
      // $FlowFixMe: how?
      target = target.parentNode;
    } while (target != null);
    if (this.mounted) {
      this.setState(state => ({...state, menuOpen: false}));
    }
  };

  onMenuButtonMenu = (menuButtonMenu: React.Component<*, *, *>) => {
    this.menuButtonMenu = menuButtonMenu;
  };

  onMenuButtonMenuToggle = (menuButtonMenuToggle: React.Component<*, *, *>) => {
    this.menuButtonMenuToggle = menuButtonMenuToggle;
  };

  render() {
    let {
      icon,
      menu,
      iconTitle,
      selected,
      disabled,
      children,
      buttonGroup,
      onIconClick,
      tabIndex = 0,
      ...rest
    } = this.props;
    let {
      menuOpen,
    } = this.state;
    let variant = {selected, disabled};
    let separateHover = icon && onIconClick;
    return (
      <MenuButtonRoot {...rest} variant={variant} tabIndex={tabIndex}>
        <HBox>
          <MenuButtonWrapper variant={{...variant, hoverStyle: !separateHover}}>
            <MenuButtonIconWrapper
              title={iconTitle}
              role={onIconClick && 'button'}
              variant={{hoverStyle: separateHover}}
              onClick={onIconClick}
              width={15}
              paddingRight={20}
              justifyContent="flex-start">
              {icon}
            </MenuButtonIconWrapper>
            <MenuButtonLabelWrapper variant={{hoverStyle: separateHover}}>
              {children}
            </MenuButtonLabelWrapper>
          </MenuButtonWrapper>
          {buttonGroup}
          {menu &&
            <MenuButtonMenuToggle
              variant={variant}
              ref={this.onMenuButtonMenuToggle}
              onClick={this.toggleMenuOpen}
            />}
        </HBox>
        {menuOpen &&
          menu &&
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
    onClick: () => *,
  };

  onClick = (ev: UIEvent) => {
    ev.stopPropagation();
    this.props.onClick();
  };

  render() {
    return (
      <MenuButtonMenuToggleRoot onClick={this.onClick}>
        <Icon.IconEllipsis />
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
  },
  disabled: {
    hover: {
      background: '#fff',
    },
  },
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
    textTransform: 'capitalize',
    background: '#fff',
  },
  selected: {
    color: '#1f85f5',
  },
  disabled: {
    color: '#aaa',
    cursor: 'not-allowed',
  },
});

let MenuButtonMenu = style(VBox, {
  displayName: 'MenuButtonMenu',
  base: {
    borderTop: css.border(1, '#bbb'),
  },
});

let MenuButtonIconWrapper = style(VBox, {
  displayName: 'MenuButtonIconWrapper',
  base: {
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
  },
  hoverStyle: {
    hover: {
      background: '#fafafa',
    },
  },
  disabled: {
    hover: {
      background: '#fff',
    },
  },
});

let MenuButtonLabelWrapper = style(VBox, {
  displayName: 'MenuButtonLabelWrapper',
  base: {
    paddingLeft: 10,
    paddingRight: 10,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    justifyContent: 'center',
    overflow: 'hidden',
    flexGrow: 1,
    height: '100%',
  },
  hoverStyle: {
    hover: {
      background: '#fafafa',
    },
  },
  disabled: {
    hover: {
      background: '#fff',
    },
  },
});

let MenuButtonWrapper = style(HBox, {
  displayName: 'MenuButtonWrapper',
  base: {
    flexGrow: 1,
    flexShrink: 1,
    height: 32,
    alignItems: 'center',
  },
  hoverStyle: {
    hover: {
      background: '#fafafa',
    },
  },
  disabled: {
    hover: {
      background: '#fff',
    },
  },
});
