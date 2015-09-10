/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind       from 'autobind-decorator';
import React          from 'react';
import Field          from './Field';
import Input          from './Input';
import tryParseFloat  from '../tryParseFloat';

class NumberInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {value: props.value};
  }

  render() {
    return (
      <Input
        {...this.props}
        value={this.state.value}
        onChange={this.onChange}
        />
    );
  }

  componentWillReceiveProps(nextProps) {
    let {value} = this.state;
    if (nextProps.value === undefined) {
      this.setState({value: ''});
    } else if (nextProps.value !== tryParseFloat(value)) {
      this.setState({value: String(nextProps.value)});
    }
  }

  @autobind
  onChange(value) {
    this.setState({value}, () => {
      if (value === '') {
        this.props.onChange(undefined);
      } else {
        value = tryParseFloat(value);
        this.props.onChange(value);
      }
    });
  }

}

export default class NumberField extends React.Component {

  render() {
    return (
      <Field {...this.props}>
        <NumberInput />
      </Field>
    );
  }
}
