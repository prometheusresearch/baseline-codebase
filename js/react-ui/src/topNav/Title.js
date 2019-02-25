/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {css, style} from 'react-stylesheet';
import theme from './theme';

export default style('a', {
  base: {
    alignSelf: 'center',
    fontSize: '19pt',
    fontWeight: 700,
    textShadow: theme.header.textShadow,
    margin: 0,
    color: theme.header.text,
    textDecoration: css.none,
    cursor: css.cursor.pointer,
  },
});
