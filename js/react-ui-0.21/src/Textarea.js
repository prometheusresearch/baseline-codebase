/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {style, css} from './stylesheet';

export default style('textarea', {
  display: 'block',
  width: '100%',
  padding: css.padding(6, 12),
  fontSize: '14px',
  lineHeight: 1.42857143,
  color: '#000',
  backgroundColor: '#fff',
  backgroundImage: css.none,
  border: css.border(1, '#ccc'),
  borderRadius: 2,
  boxShadow: css.insetBoxShadow(0, 1, 1, css.rgba(0, 0,0 , 0.075)),
  transition: 'border-color ease-in-out .15s,box-shadow ease-in-out .15s',
  focus: {
    outline: css.none,
    border: css.border(1, '#708698'),
    boxShadow: css.multi(
      css.insetBoxShadow(0, 1, 1, 0, css.rgba(0, 0, 0, 0.075)),
      css.boxShadow(0, 0, 0, 2, css.rgba(0, 126, 229, 0.5))
    ),
  },
  noBorder: {
    border: css.none,
    focus: {
      border: css.none,
    },
    error: {
      border: css.none,
    }
  },
  error: {
    border: css.border(1, 'red'),
    focus: {
      border: css.border(1, '#708698'),
      boxShadow: css.multi(
        css.insetBoxShadow(0, 1, 1, 0, css.rgba(0, 0, 0, 0.075)),
        css.boxShadow(0, 0, 0, 2, css.rgba(0, 126, 229, 0.5))
      ),
    }
  },
  disabled: {
    backgroundColor: '#f9f9f9',
    borderColor: '#f1f1f1',
    cursor: 'not-allowed',
  }
});
