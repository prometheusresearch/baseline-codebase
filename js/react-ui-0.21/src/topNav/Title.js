/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import {css, style} from '../stylesheet';
import theme from './theme';

export default style('a', {
  alignSelf: 'center',
  fontSize: '19pt',
  fontWeight: 700,
  textShadow: theme.header.textShadow,
  margin: 0,
  color: theme.header.text,
  textDecoration: css.none,
  cursor: css.cursor.pointer
});


