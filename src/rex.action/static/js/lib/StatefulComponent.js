/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind           from 'autobind-decorator';
import React, {PropTypes} from 'react';

export default class StatefulComponent extends React.Component {

  executeCommand(...pipeline) {
    let state = this.state;
    for (let i = 0; i < pipeline.length; i++) {
      state = pipeline[i](state);
    }
    if (state !== this.state) {
      let prevState = this.state;
      this.setState(state, () => {
        if (this.onExecuteComplete) {
          this.onExecuteComplete(this.state, prevState);
        }
      });
    }
  }

  scheduleCommand(command, ...prevArgs) {
    return (...nextArgs) => {
      let args = prevArgs.concat(nextArgs);
      return this.executeCommand(command(...args));
    }
  }

  static command(target, key, descriptor) {
    function command(...args) {
      return (state) => {
        args.unshift(state);
        return descriptor.value.apply(this, args);
      }
    }
    command.displayName = descriptor.value.name;
    return autobind(target, key, {
      ...descriptor,
      value: command
    });
  }
}

