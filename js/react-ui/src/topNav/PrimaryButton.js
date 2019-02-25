/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {css, style} from 'react-stylesheet';
import ButtonBase from '../ButtonBase';
import theme from './theme';

export default class PrimaryButton extends ButtonBase {
  static stylesheet = {
    ...ButtonBase.stylesheet,
    Root: style('a', {
      base: {
        cursor: css.cursor.pointer,
        fontWeight: 400,
        fontSize: '12pt',
        position: 'relative',
        textShadow: theme.header.textShadow,
        height: theme.header.height,
        color: theme.header.text,
        background: theme.header.background,
        border: css.none,
        padding: css.padding(20, 20),
        hover: {
          background: theme.header.hover.background,
        },
        focus: {
          outline: css.none,
        },
      },
      selected: {
        background: theme.subHeader.background,
        height: theme.header.height,
        top: 1,
      },
      open: {
        background: theme.header.hover.background,
      },
      small: {
        fontSize: '10pt',
      },
    }),
    Caption: style(ButtonBase.stylesheet.Caption, {
      base: {
        verticalAlign: 'middle',
      },
    }),
    IconWrapper: style(ButtonBase.stylesheet.IconWrapper, {
      hasCaption: {
        marginRight: 5,
      },
    }),
  };
}
