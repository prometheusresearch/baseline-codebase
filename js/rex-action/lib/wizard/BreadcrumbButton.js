/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {style, css} from 'react-stylesheet';

const stylesheet = {
  ...ReactUI.ButtonBase.stylesheet,
  Root: style(ReactUI.ButtonBase.stylesheet.Root, {
    base: {
      display: 'inline',
      fontSize: '80%',
      fontWeight: 200,
      color: css.rgb(100),
      border: css.rgb(204),
      background: css.rgb(255),
      height: 50,
      padding: css.padding(10, 10),
      focus: {
        outline: css.none,
      },
      hover: {
        color: css.rgb(0),
      },
    },
    current: {
      fontWeight: 400,
      color: '#0094CD',
      cursor: 'default',
      hover: {
        color: '#0094CD',
      },
    },
    page: {
      fontWeight: 200,
    },
  }),
  Caption: style(ReactUI.ButtonBase.stylesheet.Caption, {
    base: {
      verticalAlign: 'middle',
    },
  }),
  IconWrapper: style(ReactUI.ButtonBase.stylesheet.IconWrapper, {
    base: {
      position: css.position.relative,
      top: -1,
      verticalAlign: 'middle',
    },
    hasCaption: {
      marginRight: 10,
    },
  }),
};

export default function BreadcrumbButton(props: Object) {
  return <ReactUI.ButtonBase {...props} stylesheet={stylesheet} />;
}
