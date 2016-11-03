/**
 * @flow
 */

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';

type MenuButtonSecondaryProps = {
  icon?: ?string | React$Element<*>;
  tabIndex?: number;
  children?: React$Element<*>;
  onClick?: () => *;
};

export default class MenuButtonSecondary
  extends React.Component<*, MenuButtonSecondaryProps, *> {

  onClick = (ev: UIEvent) => {
    ev.stopPropagation();
    if (this.props.onClick) {
      this.props.onClick();
    }
  };

  render() {
    let {
      icon,
      children,
      tabIndex = 0,
      ...rest
    } = this.props;
    return (
      <MenuButtonSecondaryRoot
        {...rest}
        onClick={this.onClick}
        tabIndex={tabIndex}>
        {icon &&
          <VBox
            width={15}
            paddingRight={20}
            justifyContent="flex-start">
            {icon}
          </VBox>}
        {children}
      </MenuButtonSecondaryRoot>
    );
  }
}

let MenuButtonSecondaryRoot = style(HBox, {
  displayName: 'MenuButtonSecondaryRoot',
  base: {
    outline: css.none,
    height: '33px',
    cursor: 'default',
    fontSize: '10pt',
    fontWeight: 200,
    borderBottom: css.border(1, '#ddd'),
    userSelect: 'none',
    padding: 8,
    paddingLeft: 30,
    paddingRight: 10,
    color: '#666',
    backgroundColor: '#f2f2f2',
    lastOfType: {
      borderBottom: css.none,
    },
    hover: {
      color: '#222',
      backgroundColor: '#e7e7e7',
    }
  },
});
