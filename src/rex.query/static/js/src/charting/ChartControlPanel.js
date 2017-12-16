/**
 * @flow
 */

import * as React from 'react';
import {VBox} from 'react-stylesheet';

type ChartControlPanelProps = {
  children?: React.Node,
};

export default function ChartControlPanel({children}: ChartControlPanelProps) {
  return (
    <VBox
      overflow="visible"
      marginBottom={10}
      background="#fafafa"
      padding={10}
      borderBottom="1px solid #eee"
      borderTop="1px solid #eee">
      {children}
    </VBox>
  );
}
