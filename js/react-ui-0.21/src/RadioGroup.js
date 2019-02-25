/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import RadioGroupBase from './RadioGroupBase';
import Radio from './Radio';
import {style, css} from './stylesheet';
import {margin} from './theme';

export default style(RadioGroupBase, {
  Root: {
    focus: {
      outline: css.none,
    },
  },
  Radio: Radio,
  RadioWrapper: {
    vertical: {
      marginBottom: margin['xx-small'],
      lastChild: {
        marginBottom: 0,
      }
    },
    horizontal: {
      display: 'inline-block',
      ltr: {
        marginRight: margin['x-small'],
        lastChild: {
          marginRight: 0,
        }
      },
      rtl: {
        marginLeft: margin['x-small'],
        lastChild: {
          marginLeft: 0,
        }
      }
    },
  }
});
