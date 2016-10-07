/**
 * @flow
 */

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';

type MenuGroupProps = {
  title?: string | React$Element<*>;
  children?: React$Element<*>;
};

export default function MenuGroup({title, children, ...props}: MenuGroupProps) {
  return (
    <VBox {...props}>
      {title &&
        <MenuGroupTitle>
          {title}
        </MenuGroupTitle>}
      <MenuGroupChildren>
        {children}
      </MenuGroupChildren>
    </VBox>
  );
}

let MenuGroupChildren = style(VBox, {
  base: {
    borderTop: css.border(1, '#eee'),
  }
});

let MenuGroupTitle = style(VBox, {
  base: {
    fontSize: '8pt',
    fontWeight: 200,
    padding: 5,
    paddingLeft: 5,
    color: '#888',
  }
});
