/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactForms from 'react-forms/reactive';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';
import * as HotKey from './HotKey';

import Widget from '../Widget';

const WIDTH = {
  small: '25%',
  medium: '50%',
  large: '100%',
};

export default function InputText({
  editable, onCommitEdit, onCancelEdit,
  options: {width = 'medium'},
  children,
  ...props
}) {
  if (!children) {
    children = <ReactForms.Input Component={ReactUI.Input} />;
  }
  return (
    <ReactUI.Block width={WIDTH[width]}>
      <HotKey.EditHotKeyHandler
        editable={editable}
        onCommitEdit={onCommitEdit}
        onCancelEdit={onCancelEdit}>
        <Widget {...props}>
          {children}
        </Widget>
      </HotKey.EditHotKeyHandler>
    </ReactUI.Block>
  );
}
