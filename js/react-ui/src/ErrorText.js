/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {style} from 'react-stylesheet';
import Text from './Text';
import {fontSize} from './theme';

export default style(Text, {
  displayName: 'ErrorText',
  base: {
    color: 'red',
    fontSize: fontSize['x-small'],
  },
});
