/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import {css, style} from '../stylesheet';
import ButtonBase from '../ButtonBase';
import theme from './theme';

export default style(ButtonBase, {
  Root: {
    Component: 'a',
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: 400,
    textShadow: theme.subHeader.textShadow,
    fontSize: '10pt',
    position: 'relative',
    color: theme.subHeader.text,
    background: theme.subHeader.background,
    border: css.none,
    height: theme.subHeader.height,
    padding: css.padding(0, 25),
    borderTop: css.border(4, theme.subHeader.background),
    borderBottom: css.border(4, theme.subHeader.background),
    open: {
      borderBottom: css.border(5, theme.header.background),
    },
    focus: {
      outline: css.none,
    },
  }
});
