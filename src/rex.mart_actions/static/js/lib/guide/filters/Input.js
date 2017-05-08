/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import {style, css} from 'react-stylesheet';
import {InputRoot} from '@prometheusresearch/react-ui/lib/Input';


let StyledInputRoot = style(InputRoot, {
  error: {
    backgroundColor: css.rgba(255, 182, 193, 0.38),
    border: 'none',
    boxShadow: [
      {
        x: 0,
        y: 0,
        spread: 2,
        color: 'red',
      },
    ],
    focus: {
      border: 'none',
      boxShadow: [
        {
          x: 0,
          y: 0,
          spread: 2,
          color: 'red',
        },
      ],
      backgroundColor: css.rgba(255, 182, 193, 0.38),
    },
  },
});

export default function Input({error, disabled, noBorder, ...props}) {
  let variant = {noBorder, disabled, error};
  return <StyledInputRoot {...props} disabled={disabled} variant={variant} />;
}

