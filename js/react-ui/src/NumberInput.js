/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import Input from './Input';

import {tryParseNumber, extractValueFromEvent} from './FormUtils';

export default class NumberInput extends React.Component {
  static stylesheet = {
    Input: Input,
  };

  static defaultProps = {
    value: '',
  };

  constructor(props) {
    super(props);
    this.state = {value: props.value};
  }

  render() {
    let {Input} = this.constructor.stylesheet;
    return <Input {...this.props} value={this.state.value} onChange={this.onChange} />;
  }

  componentWillReceiveProps(nextProps) {
    let {value} = this.state;
    if (nextProps.value == null) {
      this.setState({value: ''});
    } else if (nextProps.value !== tryParseNumber(value)) {
      this.setState({value: String(nextProps.value)});
    }
  }

  onChange = event => {
    let value = extractValueFromEvent(event);
    this.setState({value: value || ''}, () => {
      if (value !== null) {
        value = tryParseNumber(value);
      }
      this.props.onChange(value);
    });
  };
}
