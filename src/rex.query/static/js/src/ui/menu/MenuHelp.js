/**
 * @flow
 */

import React from 'react';
import {style, css, VBox} from 'react-stylesheet';

export default function MenuHelp(props: Object) {
  return <MenuHelpRoot {...props} />;
}

let MenuHelpRoot = style(VBox, {
  displayName: 'MenuHelpRoot',
  base: {
    userSelect: css.none,
    cursor: css.cursor.default,
    fontSize: '8pt',
    fontWeight: 200,
    padding: 5,
    margin: 5,
    color: '#666',
  },
});
