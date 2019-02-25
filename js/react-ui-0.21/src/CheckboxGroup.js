/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import CheckboxGroupBase from './CheckboxGroupBase';
import Checkbox from './Checkbox';
import {style, css} from './stylesheet';
import {margin} from './theme';

export default style(CheckboxGroupBase, {
  Root: {
    focus: {
      outline: css.none,
    },
  },
  Checkbox: Checkbox,
  CheckboxWrapper: {
    vertical: {
      marginBottom: margin['xx-small'],
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
