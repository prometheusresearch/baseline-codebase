/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import RadioGroupBase, {stylesheet} from './RadioGroupBase';
import Radio from './Radio';
import {style, css} from 'react-stylesheet';
import {margin} from './theme';

export default class RadioGroup extends RadioGroupBase {
  static stylesheet = {
    ...stylesheet,
    Root: style(stylesheet.Root, {
      focus: {
        outline: css.none,
      },
    }),

    Radio: Radio,

    RadioWrapper: style(stylesheet.RadioWrapper, {
      vertical: {
        marginBottom: margin['xx-small'],
        lastChild: {
          marginBottom: 0,
        },
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
