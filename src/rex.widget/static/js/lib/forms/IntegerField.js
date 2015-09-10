/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind     from 'autobind-decorator';
import React        from 'react';
import tryParseInt  from '../tryParseInt';
import Field        from './Field';
import Input        from './Input';

class IntegerInput extends React.Component {

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
      this.props.onChange(undefined);
    } else {
      value = tryParseInt(value);
      this.props.onChange(value);
    }
  }

}

export default class IntegerField extends React.Component {

  render() {
    return (
      <Field {...this.props}>
        <IntegerInput />
      </Field>
    );
  }
}
