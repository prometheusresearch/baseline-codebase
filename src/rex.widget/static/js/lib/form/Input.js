/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {Input as BaseInput} from 'react-forms';

import * as stylesheet from '../../stylesheet';
import * as css from '../../css';

/**
 * Text input component.
 *
 * @public
 */
export default class Input extends React.Component {
  static propTypes = {
    /**
     * Render in error state.
     */
    error: React.PropTypes.any,

    /**
     * Input's DOM type.
     */
    type: React.PropTypes.string,
  };

  static defaultProps = {
    type: 'text',
  };

  static stylesheet = stylesheet.create({
    Root: stylesheet.styleDOM(BaseInput, {
      display: 'block',
      width: '100%',
      height: 34,
      padding: css.padding(6, 12),
      fontSize: '14px',
      lineHeight: 1.42857143,
      color: '#000',
      backgroundColor: '#fff',
      backgroundImage: css.none,
      border: css.border(1, '#ccc'),
      borderRadius: 2,
      boxShadow: css.insetBoxShadow(0, 1, 1, css.rgba(0, 0, 0, 0.075)),
      transition: 'border-color ease-in-out .15s,box-shadow ease-in-out .15s',
      error: {
        border: css.border(1, 'red'),
      },
      focus: {
        border: css.border(1, '#888'),
        boxShadow: css.insetBoxShadow(0, 1, 1, css.rgba(0, 0, 0, 0.075)),
        outline: css.none,
      },
      noBorder: {
        border: css.none,
        focus: {
          border: css.none,
        },
        error: {
          border: css.none,
        },
      },
    }),
  });

  render() {
    let {error, variant, ...props} = this.props;
    let {Root} = this.constructor.stylesheet;
    return (
      <Root {...this.props} variant={{...variant, error}} onChange={this.onChange} />
    );
  }

  onChange = value => {
    if (value != null) {
      value = value.trim();
    }
    if (value === '' || value === undefined) {
      value = null;
    }
    this.props.onChange(value);
  };
}
