/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import {style, css} from 'react-stylesheet';

let InputRootFocus = {
  outline: 'none',
  border: {width: 1, style: 'solid', color: '#708698'},
  boxShadow: [
    {
      inset: true,
      x: 0,
      y: 1,
      blur: 1,
      color: css.rgba(0, 0, 0, 0.075),
    },
    {
      x: 0,
      y: 0,
      spread: 2,
      color: css.rgba(0, 126, 229, 0.5),
    },
  ],
};

let InputRootTransition = [
  {
    property: 'border-coolor',
    timingFunction: 'ease-in-out',
    duration: 0.15,
  },
  {
    property: 'box-shadow',
    timingFunction: 'ease-in-out',
    duration: 0.15,
  },
];

export const InputRoot = style('input', {
  base: {
    display: 'block',
    width: '100%',
    padding: {vertical: 6, horizontal: 12},
    fontSize: '14px',
    lineHeight: 1.42857143,
    color: '#000',
    backgroundColor: '#fff',
    backgroundImage: 'none',
    border: {
      width: 1,
      style: 'solid',
      color: '#ccc',
    },
    borderRadius: 2,
    boxShadow: {
      x: 0,
      y: 1,
      blur: 1,
      color: css.rgba(0, 0, 0, 0.075),
    },
    transition: InputRootTransition,
    focus: InputRootFocus,
  },
  noBorder: {
    border: 'none',
    focus: {
      border: 'none',
    },
  },
  error: {
    border: {width: 1, style: 'solid', color: 'red'},
    focus: InputRootFocus,
  },
  disabled: {
    backgroundColor: '#f9f9f9',
    borderColor: '#f1f1f1',
    cursor: 'not-allowed',
  },
});

export type InputProps = {
  noBorder?: boolean,
  disabled?: boolean,
  error?: boolean,
};

export default function Input({error, disabled, noBorder, ...props}: InputProps) {
  let variant = {noBorder, disabled, error};
  return <InputRoot {...props} disabled={disabled} variant={variant} />;
}
