/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {style, css} from 'react-stylesheet';
import CheckboxGroupBase, {stylesheet} from './CheckboxGroupBase';
import Checkbox from './Checkbox';
import {margin} from './theme';

export default class CheckboxGroup extends CheckboxGroupBase {
  static stylesheet = {
    ...stylesheet,
    Root: style(stylesheet.Root, {
      focus: {
        outline: css.none,
      },
    }),
    Checkbox: Checkbox,
    CheckboxWrapper: style(stylesheet.CheckboxWrapper, {
      vertical: {
        marginBottom: margin['xx-small'],
      },
      horizontal: {
        display: 'inline-block',
      },
      horizontal_ltr: {
        marginRight: margin['x-small'],
        lastChild: {
          marginRight: 0,
        },
      },
      horizontal_rtl: {
        marginLeft: margin['x-small'],
        lastChild: {
          marginLeft: 0,
        },
      },
    }),
  };
}
