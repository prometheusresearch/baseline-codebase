/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import {css, style} from '../stylesheet';
import ButtonBase from '../ButtonBase';
import theme from './theme';

export default style(ButtonBase, {
  Root: {
    Component: 'a',
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
    selected: {
      background: theme.subHeader.background,
      height: theme.header.height,
      top: 1,
    },
    open: {
      background: theme.header.hover.background,
    },
    hover: {
      background: theme.header.hover.background,
    },
    focus: {
      outline: css.none,
    },
    small: {
      fontSize: '10pt',
    }
  },
  Caption: {
    verticalAlign: 'middle',
  },
  IconWrapper: {
    hasCaption: {
      marginRight: 5
    }
  },
});
