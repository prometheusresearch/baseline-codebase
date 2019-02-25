/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {style, css} from 'react-stylesheet';
import Text from './Text';
import {fontSize} from './theme';

export default style(Text, {
  displayName: 'LabelText',
  base: {
    color: '#444',
    fontWeight: css.fontWeight.bold,
    fontSize: fontSize.small,
    textAlign: css.textAlign.left,
    padding: css.padding(0, 0),
  },
  disabled: {
    color: '#aaa',
    cursor: 'not-allowed',
  },
});
