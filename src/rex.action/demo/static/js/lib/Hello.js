
import React from 'react';
import {Action} from 'rex-action';

export default class Hello extends React.Component {

  render() {
    return (
      <Action title={this.props.title}>
        <div>Hello, world!</div>
      </Action>
    );
  }
}
