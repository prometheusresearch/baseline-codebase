/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {style, css} from 'react-stylesheet';
import RadioBase, {stylesheet} from './RadioBase';
import Block from './Block';
import {margin, textColors} from './theme';

export default class Radio extends RadioBase {
  static stylesheet = {
    ...stylesheet,
    Label: style(stylesheet.Label, {
      base: {
        fontSize: '0.875rem',
        fontWeight: 200,
        color: '#444',
      },
      disabled: {
        cursor: 'not-allowed',
        color: textColors.disabled,
      },
    }),
    Input: style(stylesheet.Input, {
      base: {
        verticalAlign: 'middle',
      },
      disabled: {
        cursor: 'not-allowed',
      },
    }),
    LabelWrapper: style(Block, {
      base: {
        cursor: css.cursor.default,
        display: 'inline-block',
        verticalAlign: 'middle',
        userSelect: 'none',
      },
      ltr: {
        marginLeft: margin['x-small'],
      },
      rtl: {
        marginRight: margin['x-small'],
      },
    }),
    Hint: style(stylesheet.Hint, {
      base: {
        fontSize: '0.6rem',
      },
      disabled: {
        cursor: 'not-allowed',
        color: textColors.disabled,
      },
    }),
  };
}
