/**
 * @flow
 */

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';

type MessageProps = {
  children?: React.Element<any>;
};

export default function Message({children, ...props}: MessageProps) {
  return (
    <MessageRoot {...props}>
      <MessageChildrenWrapper>
        {children}
      </MessageChildrenWrapper>
    </MessageRoot>
  );
}

let MessageRoot = style(VBox, {
  displayName: 'MessageRoot',
  base: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',

    fontWeight: 200,
    fontSize: '10pt',
    color: '#aaa',
  }
});

let MessageChildrenWrapper = style(HBox, {
  displayName: 'MessageChildrenWrapper',
  base: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
