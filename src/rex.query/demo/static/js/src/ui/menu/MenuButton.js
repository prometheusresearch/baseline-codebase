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
  onClick: (ev: MouseEvent) => *;
  onIconClick?: (ev: MouseEvent) => *;
  children?: React$Element<*>;
};

export default function MenuButton(props: MenuButtonProps) {
  let {icon, selected, children, onIconClick, onClick} = props;
  return (
    <ColumnButtonRoot onClick={onClick} variant={{selected}}>
      <VBox
        onClick={onIconClick}
        width={15}
        paddingRight={20}
        justifyContent="flex-start">
        {icon}
      </VBox>
      {children}
    </ColumnButtonRoot>
  );
}

let ColumnButtonRoot = style(HBox, {
  base: {
    cursor: 'pointer',
    fontSize: '10pt',
    fontWeight: 200,
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottom: css.border(1, '#eee'),
    userSelect: 'none',
    hover: {
      background: '#fafafa',
    }
  },
  selected: {
    color: '#1f85f5',
  }
});

