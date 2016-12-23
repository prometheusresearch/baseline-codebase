/**
 * @flow
 */

import React from 'react';
import {style} from 'react-stylesheet';

export default function Label({label, ...props}: {label: string | React.Element<*>}) {
  return <LabelRoot title={label}>{label}</LabelRoot>;
}

let LabelRoot = style('div', {
  base: {
    display: 'inline-block',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  }
});
