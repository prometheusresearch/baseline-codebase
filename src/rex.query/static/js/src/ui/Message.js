/**
 * @flow
 */

import React from 'react';
import {style, VBox} from 'react-stylesheet';

type MessageProps = {
  children?: React.Element<any>,
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
  },
});

let MessageChildrenWrapper = style('p', {
  displayName: 'MessageChildrenWrapper',
  base: {
    width: '80%',
    textAlign: 'center',
  },
});
