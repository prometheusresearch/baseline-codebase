/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import invariant from 'invariant';
import Input from './Input';

import {tryParseInteger, extractValueFromEvent} from './FormUtils';

type Props = {
  value: string | number,
  onChange: (number | string) => *,
};

export default class IntegerInput extends React.Component<*, Props, *> {
  state: {
    value: string,
  };

  static stylesheet = {
    Input: Input,
  };

  static defaultProps = {
    value: '',
  };

  constructor(props: Props) {
    super(props);
    this.state = {value: props.value ? String(props.value) : ''};
  }

  render() {
    let {Input} = this.constructor.stylesheet;
    return <Input {...this.props} value={this.state.value} onChange={this.onChange} />;
  }

  componentWillReceiveProps(nextProps: Props) {
    let {value} = this.state;
    if (nextProps.value == null) {
      this.setState({value: ''});
    } else if (nextProps.value !== tryParseInteger(value)) {
      this.setState({value: String(nextProps.value)});
    }
  }

  onChange = (event: UIEvent) => {
    const value = extractValueFromEvent(event) || '';
    invariant(
      typeof value === 'string',
      'Expected a string value from the underlying input',
    );
    this.setState({value}, () => {
      if (value != null) {
        this.props.onChange(tryParseInteger(value));
      } else {
        this.props.onChange(value);
      }
    });
  };
}
