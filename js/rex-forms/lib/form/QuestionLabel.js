/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';
import LocalizedString from './LocalizedString';
import MarkupString from './MarkupString';

export default function QuestionLabel({
  required,
  disabled,
  text = this.props.children,
  ...props
}) {
  return (
    <ReactUI.Block marginBottom="small" {...props}>
      {required &&
        <ReactUI.Block inline marginRight="xx-small">
          <ReactUI.ErrorText fontSize="medium">*</ReactUI.ErrorText>
        </ReactUI.Block>}
      <ReactUI.LabelText variant={{disabled}}>
        <LocalizedString
          Component={MarkupString}
          inline
          text={text}
          />
      </ReactUI.LabelText>
    </ReactUI.Block>
  );
}

