/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import LocalizedString from './LocalizedString';
import MarkupString from './MarkupString';
import isReactElement from '../isReactElement';

export default function Label({text, children, hotkey, ...props}) {
  text = text || children;
  return (
    <ReactUI.Block {...props} maxWidth="100%" inline>
      {hotkey && <ReactUI.LabelText>[{hotkey}]</ReactUI.LabelText>}
      {hotkey && ' '}
      {isReactElement(text) ?
        text :
        <LocalizedString
          Component={MarkupString}
          inline
          text={text}
          />}
    </ReactUI.Block>
  );
}
