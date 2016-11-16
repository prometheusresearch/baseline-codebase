/**
 * @flow
 */

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';
import MenuTitle from './MenuTitle';

type MenuGroupProps = {
  title?: string | React$Element<*>;
  children?: React$Element<*>;
};

export default function MenuGroup({title, children, ...props}: MenuGroupProps) {
  return (
    <VBox {...props}>
      {title &&
        <MenuTitle>
          {title}
        </MenuTitle>}
      <MenuGroupChildren variant={{noTitle: title == null}}>
        {children}
      </MenuGroupChildren>
    </VBox>
  );
}

let MenuGroupChildren = style(VBox, {
  noTitle: {
    borderTop: css.border(1, '#ddd'),
  }
});
