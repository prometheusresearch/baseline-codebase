/**
 * @copyright 2016-present, Prometheus Research, LLC
 */


import RadioBase from './RadioBase';
import Block from './Block';
import {style, css} from './stylesheet';
import {margin, textColors} from './theme';

export default style(RadioBase, {
  Label: {
    fontSize: '0.875rem',
    fontWeight: 400,
    color: '#444',
    disabled: {
      cursor: 'not-allowed',
      color: textColors.disabled,
    },
  },
  Input: {
    verticalAlign: 'middle',
    disabled: {
      cursor: 'not-allowed',
    },
  },
  LabelWrapper: style(Block, {
    cursor: css.cursor.default,
    display: 'inline-block',
    verticalAlign: 'middle',
    userSelect: 'none',
    ltr: {
      marginLeft: margin['x-small'],
    },
    rtl: {
      marginRight: margin['x-small'],
    },
  }),
  Hint: {
    fontSize: '0.6rem',
    disabled: {
      cursor: 'not-allowed',
      color: textColors.disabled,
    },
  }
});
