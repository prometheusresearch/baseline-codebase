/**
 * @copyright 2017, Prometheus Research, LLC
 * @flow
 */

import React from 'react';

import {VBox} from 'react-stylesheet';

export default class ScrollablePanel extends React.Component {
  props: {
    children: React.Element<*>,
  };

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
