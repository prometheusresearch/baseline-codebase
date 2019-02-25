/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {css, style} from 'react-stylesheet';
import ButtonBase from '../ButtonBase';
import theme from './theme';

const borderWidth = 3;

export default class SecondaryButton extends ButtonBase {
  static stylesheet = {
    ...ButtonBase.stylesheet,
    Root: style('a', {
      base: {
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
        cursor: 'pointer',
        fontWeight: 400,
        textShadow: theme.subHeader.textShadow,
        fontSize: '10pt',
        position: 'relative',
        color: theme.subHeader.text,
        border: css.none,
        height: theme.subHeader.height,
        padding: css.padding(0, 25),
        borderBottom: css.border(borderWidth, 'transparent'),
        hover: {
          background: theme.subHeader.background,
        },
        focus: {
          outline: css.none,
        },
      },
      open: {
        borderBottom: css.border(borderWidth, theme.header.background),
        hover: {
          borderBottom: css.border(borderWidth, theme.header.background),
        },
      },
    }),
  };
}
