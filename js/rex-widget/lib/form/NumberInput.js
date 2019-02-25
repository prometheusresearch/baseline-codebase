/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React          from 'react';
import Input          from './Input';
import tryParseFloat  from '../tryParseFloat';

export default class NumberInput extends React.Component {

  static defaultProps = {
    value: ''
  };

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

  onChange = (value) => {
    this.setState({value}, () => {
      if (value === '') {
        this.props.onChange(undefined); // eslint-disable-line react/prop-types
      } else {
        value = tryParseFloat(value);
        this.props.onChange(value); // eslint-disable-line react/prop-types
      }
    });
  };
}
