/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';


export default class DefinitionView extends React.Component {
  static defaultProps = {
    icon: 'file'
  };

  render() {
    return (
      <div>
        <p>You are viewing Definition <strong>{this.props.context.mart_definition}</strong></p>
        <p>TODO</p>
      </div>
    );
  }
}

