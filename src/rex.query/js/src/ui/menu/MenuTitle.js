/**
 * @flow
 */

import React from 'react';
import {style, css, VBox} from 'react-stylesheet';

export default function MenuTitle(
  {
    size = 'normal',
    ...props
  }: {
    size?: 'normal' | 'large',
  },
) {
  return <MenuTitleRoot {...props} variant={{large: size === 'large'}} />;
}

let MenuTitleRoot = style(VBox, {
  displayName: 'MenuTitleRoot',
  base: {
    borderBottom: css.border(1, '#ddd'),
    userSelect: css.none,
    cursor: css.cursor.default,
    fontSize: '8pt',
    fontWeight: 200,
    padding: 5,
    paddingLeft: 5,
    color: '#666',
  },
  large: {
    fontSize: '10pt',
  },
});
