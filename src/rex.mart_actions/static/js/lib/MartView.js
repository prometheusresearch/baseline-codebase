/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';


export default class MartView extends React.Component {
  static defaultProps = {
    icon: 'file'
  };

  render() {
    return (
      <div>
        <p>You are viewing Mart <strong>#{this.props.context.mart}</strong></p>
        <p>TODO</p>
      </div>
    );
  }
}

