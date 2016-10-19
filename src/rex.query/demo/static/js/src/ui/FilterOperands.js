import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';

import Select from './Select';


export class TextOperand extends React.Component {
  render() {
    let {type, value, onChange, ...props} = this.props;  // eslint-disable-line no-unused-vars
    return (
      <ReactUI.Input
        {...props}
        value={value == null ? '' : value}
        onChange={this.onChange}
        />
    );
  }

  onChange = (event) => {
    this.props.onChange(event.target.value || null);
  };
}


export class NumberOperand extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      error: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({
        value: nextProps.value,
        error: false,
      });
    }
  }

  render() {
    return (
      <TextOperand
        variant={{'error': this.state.error}}
        value={this.state.value}
        onChange={this.onChange}
        />
    );
  }

  onChange = (value) => {
    let num = Number(value);
    if ((value != null) && (num.toString() === value)) {
      this.setState({value, error: false}, () => { this.props.onChange(num); });
    } else {
      this.setState({value, error: true});
    }
  };
}


export class EnumerationOperand extends React.Component {
  render() {
    return (
      <Select
        value={this.props.value}
        options={this.props.options}
        onChange={this.props.onChange}
        />
    );
  }
}

