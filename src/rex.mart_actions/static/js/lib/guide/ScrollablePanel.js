/**
 * @copyright 2017, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';

import {VBox} from 'react-stylesheet';

type Props = {
  children?: React.Node,
};
export default class ScrollablePanel extends React.Component<Props> {
  render() {
    return (
      <VBox
        style={{
          padding: 10,
          flexGrow: 1,
          flexBasis: 0,
          overflowY: 'auto',
        }}>
        {this.props.children}
      </VBox>
    );
  }
}
