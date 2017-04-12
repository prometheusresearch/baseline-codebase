/**
 * @flow
 */

import React from 'react';
import {css, VBox} from 'react-stylesheet';

import * as Theme from './Theme';

type ErrorPanelProps = {
  children?: React.Element<*>,
  borderTop?: boolean,
  borderBottom?: boolean,
  borderRight?: boolean,
  borderLeft?: boolean,
};

export default function ErrorPanel(
  {
    children,
    borderTop,
    borderLeft,
    borderBottom,
    borderRight,
  }: ErrorPanelProps,
) {
  let borderStyle = css.border(2, Theme.invalid.borderColor);
  return (
    <VBox
      borderTop={borderTop ? borderStyle : undefined}
      borderBottom={borderBottom ? borderStyle : undefined}
      borderLeft={borderLeft ? borderStyle : undefined}
      borderRight={borderRight ? borderStyle : undefined}
      fontSize="9pt"
      padding={10}
      color={Theme.invalid.textColor}
      background={Theme.invalid.backgroundColor}>
      {children}
    </VBox>
  );
}
