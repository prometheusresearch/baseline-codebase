/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import {create} from './stylesheet';
import Input from './Input';

import {
  tryParseInteger,
  extractValueFromEvent
} from './FormUtils';

let stylesheet = create({
  Input: Input,
});

export default class IntegerInput extends React.Component {

  static defaultProps = {
    stylesheet,
    value: '',
  };

  constructor(props) {
    super(props);
    this.state = {value: props.value};
  }

  render() {
    let {stylesheet: {Input}, ...props} = this.props;
    return (
      <Input
        {...props}
        value={this.state.value}
        onChange={this.onChange}
        />
    );
  }

  componentWillReceiveProps(nextProps) {
    let {value} = this.state;
    if (nextProps.value == null) {
      this.setState({value: ''});
    } else if (nextProps.value !== tryParseInteger(value)) {
      this.setState({value: String(nextProps.value)});
    }
  }

  onChange = event => {
    let value = extractValueFromEvent(event);
    this.setState({value: value || ''}, () => {
      if (value !== null) {
        value = tryParseInteger(value);
      }
      this.props.onChange(value);
    });
  }

}
