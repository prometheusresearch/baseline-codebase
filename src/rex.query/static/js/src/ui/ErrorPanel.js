/**
 * @flow
 */

import React from 'react';
import {css, VBox} from 'react-stylesheet';

import * as Theme  from './Theme';

type ErrorPanelProps = {
  children?: React.Element<*>;
  borderTop?: boolean;
  borderBottom?: boolean;
  borderRight?: boolean;
  borderLeft?: boolean;
};

export default function ErrorPanel({
  children,
  borderTop, borderLeft, borderBottom, borderRight
}: ErrorPanelProps) {
  let borderStyle = css.border(2, Theme.invalid.borderColor);
  return (
    <VBox
      borderTop={borderTop ? borderStyle : null}
      borderBottom={borderBottom ? borderStyle : null}
      borderLeft={borderLeft ? borderStyle : null}
      borderRight={borderRight ? borderStyle : null}
      fontSize="9pt"
      padding={10}
      color={Theme.invalid.textColor}
      background={Theme.invalid.backgroundColor}>
      {children}
    </VBox>
  );
}
