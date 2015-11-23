/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import Chrome from 'rex-widget/lib/Chrome';

class Toolbar extends React.Component {
  render() {
    return (
      <div>Rex Widget Demo</div>
    );
  }
}

export default class DemoChrome extends React.Component {
  render() {
    let {content, ...props} = this.props;
    return (
      <Chrome {...props}>
        <Toolbar />
        {content}
      </Chrome>
    );
  }
}
