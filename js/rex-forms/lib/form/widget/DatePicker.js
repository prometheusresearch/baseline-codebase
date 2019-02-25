/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactForms from 'react-forms/reactive';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';

import MaskedInput from '../MaskedInput';
import InputText from './InputText';

function Input(props) {
  return <ReactUI.Input {...props} Component={MaskedInput} />;
}

export default function DatePicker(props) {
  if (!props.options || !props.options.width) {
    props.options.width = 'small';
  }
  return (
    <InputText {...props}>
      <ReactForms.Input Component={Input} mask="9999-99-99" />
    </InputText>
  );
}
