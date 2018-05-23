/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactForms from 'react-forms/reactive';
import * as ReactUI from '@prometheusresearch/react-ui';

import MaskedInput from '../MaskedInput';
import InputText from './InputText';


class Input extends React.Component {
  onChange(value) {
    if (value && value.endsWith(':__')) {
      value = value.substring(0, (value.length - 3));
    }
    this.props.onChange(value);
  }

  onBlur() {
    let {value} = this.props;
    if (value && value.match(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d$/)) {
      this.props.onChange(value + ':00');
    }
    this.props.onBlur();
  }

  render() {
    return (
      <ReactUI.Input
        {...this.props}
        mask="9999-99-99T99:99:99"
        Component={MaskedInput}
        onChange={this.onChange.bind(this)}
        onBlur={this.onBlur.bind(this)}
        />
    );
  }
}

export default function TimePicker(props) {
  if (!props.options || !props.options.width) {
    props.options.width = 'medium';
  }
  return (
    <InputText {...props}>
      <ReactForms.Input Component={Input} />
    </InputText>
  );
}
