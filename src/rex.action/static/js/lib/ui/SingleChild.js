/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';

export default class SingleChild extends React.Component {
  render() {
    let children = React.Children.toArray(this.props.children);
    return children[0] || null;
  }
}
