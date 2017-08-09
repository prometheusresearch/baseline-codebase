/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import DateTimeField from '@prometheusresearch/react-datetimepicker';
import {css} from 'react-stylesheet';

export default class DateInput extends React.Component {
  render() {
    let {error, placeholder, inputProps, ...props} = this.props;

    inputProps = inputProps || {};
    inputProps.placeholder = placeholder;

    inputProps.style = inputProps.style || {};
    if (error) {
      inputProps.style.backgroundColor = css.rgba(255, 182, 193, 0.38);
      inputProps.style.border = 'none';
      inputProps.style.boxShadow = css.boxShadow(0, 0, 0, 2, 'red');
    }

    return <DateTimeField inputProps={inputProps} {...props} />;
  }
}
