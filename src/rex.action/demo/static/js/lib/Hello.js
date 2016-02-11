
import React from 'react';
import {Action} from 'rex-action';

export default class Hello extends React.Component {

  render() {
    let {title, onClose} = this.props;
    return (
      <Action title={title} onClose={onClose}>
        <div>Hello, world!</div>
      </Action>
    );
  }
}
