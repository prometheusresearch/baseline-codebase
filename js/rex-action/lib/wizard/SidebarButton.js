/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {style, css} from 'react-stylesheet';

const activeStyle = {
  color: '#0094CD',
  background: 'white',
  fontWeight: 400,
  hover: {
    color: '#0094CD',
  },
};

const hoverStyle = {
  color: '#333',
};

const focusStyle = {
  outline: css.none,
};

const stylesheet = {
  ...ReactUI.ButtonBase.stylesheet,
  Root: style(ReactUI.ButtonBase.stylesheet.Root, {
    base: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      height: 48,
      minHeight: 48,
      fontSize: '10pt',
      fontWeight: 200,
      background: 'transparent',
      padding: css.padding(15, 20),
      border: css.border(1, 'transparent'),
      color: '#646464',
      whiteSpace: 'nowrap',
      hover: hoverStyle,
      active: activeStyle,
      focus: focusStyle,
    },
    active: activeStyle,
  }),
  Caption: style(ReactUI.ButtonBase.stylesheet.Caption, {
    base: {
      display: 'inline',
      marginLeft: 10,
    },
  }),
};

export default function SidebarButton(props: Object) {
  return <ReactUI.ButtonBase {...props} stylesheet={stylesheet} />;
}
