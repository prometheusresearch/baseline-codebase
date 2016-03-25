/**
 * @copyright 2016, Prometheus Research, LLC
 */

import autobind     from 'autobind-decorator';
import React        from 'react';
import tryParseInt  from '../tryParseInt';
import Input        from './Input';

export default class IntegerInput extends React.Component {

  render() {
    return (
      <Input
        {...this.props}
        onChange={this.onChange}
        />
    );
  }

  @autobind
  onChange(value) {
    if (value === '') {
      this.props.onChange(undefined); // eslint-disable-line react/prop-types
    } else {
      value = tryParseInt(value);
      this.props.onChange(value); // eslint-disable-line react/prop-types
    }
  }

}
