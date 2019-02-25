/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';
import LocalizedString from './LocalizedString';
import MarkupString from './MarkupString';

function HelpText({disabled, ...props}) {
  return (
    <MarkupString
      {...props}
      color={disabled ? '#aaa' : undefined}
      inline
      fontSize="x-small"
      Component={ReactUI.Text}
      />
  );
}

export default function Help({text, children, disabled}) {
  text = text || children;
  return (
    <LocalizedString
      disabled={disabled}
      text={text}
      Component={HelpText}
      />
  );
}

