/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {style, css} from 'react-stylesheet';
import CheckboxBase, {stylesheet} from './CheckboxBase';
import {margin, textColors} from './theme';
import Block from './Block';

export default class Checkbox extends CheckboxBase {
  static stylesheet = {
    ...stylesheet,
    Label: style(stylesheet.Label, {
      base: {
        fontSize: '0.875rem',
        fontWeight: 400,
        color: '#444',
        userSelect: 'none',
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
