/**
 * @flow
 */

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';

type MenuButtonProps = {
  icon?: ?string | React$Element<*>;
  selected?: boolean;
  onIconClick?: (ev: MouseEvent) => *;
  tabIndex?: number;
  children?: React$Element<*>;
  buttonGroup?: ?React$Element<*>;
};

export default function MenuButton(props: MenuButtonProps) {
  let {
    icon,
    selected,
    children,
    buttonGroup,
    onIconClick,
    tabIndex = 0,
    ...rest
  } = props;
  return (
    <MenuButtonRoot {...rest} variant={{selected}} tabIndex={tabIndex}>
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
    </MenuButtonRoot>
  );
}

let MenuButtonRoot = style(HBox, {
  base: {
    outline: css.none,
    height: '33px',
    cursor: 'pointer',
    fontSize: '10pt',
    fontWeight: 200,
    borderBottom: css.border(1, '#ddd'),
    userSelect: 'none',
    hover: {
      background: '#fafafa',
    }
  },
  selected: {
    color: '#1f85f5',
  },
});


let MenuButtonWrapper = style(HBox, {
  base: {
    flexGrow: 1,
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
  }
});
