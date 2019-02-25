/**
 * @flow
 */

import * as React from 'react';
import {style, css, VBox} from 'react-stylesheet';
import MenuTitle from './MenuTitle';

type MenuGroupProps = {
  title?: React.Node,
  children?: React.Node,
};

export default function MenuGroup({title, children, ...props}: MenuGroupProps) {
  return (
    <VBox {...props}>
      {title &&
        <MenuTitle>
          {title}
        </MenuTitle>}
      <MenuGroupChildren overflow="visible" variant={{noTitle: title == null}}>
        {children}
      </MenuGroupChildren>
    </VBox>
  );
}

let MenuGroupChildren = style(VBox, {
  noTitle: {
    borderTop: css.border(1, '#ddd'),
  },
});
