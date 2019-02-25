/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactForms from 'react-forms/reactive';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';
import {style} from '@prometheusresearch/react-ui-0.21/stylesheet';
import InputText from './InputText';

function Input(props) {
  return <ReactForms.Input {...props} Component={ReactUI.Input} />;
}

let NumberInput = style(ReactUI.NumberInput, {
  Input: Input
});

let IntegerInput = style(ReactUI.IntegerInput, {
  Input: Input
});

export default function InputNumber(props) {
  let {instrument: {type}} = props;
  let input = type.base === 'float' ?
    <NumberInput /> :
    <IntegerInput />;
  return <InputText {...props}>{input}</InputText>;
}

