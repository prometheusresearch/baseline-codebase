/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind           from 'autobind-decorator';
import ReactStylesheet    from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}       from '@prometheusresearch/react-box';
import React              from 'react';
import * as Execution     from '../Execution';
import ActionButton       from './ActionButton';
import Sidebar            from './Sidebar';
import ContextToolbar     from './ContextToolbar';
import NavigationToolbar  from './NavigationToolbar';

@ReactStylesheet
export default class Wizard extends React.Component {

  static stylesheet = {
    ActionPanel: {
      Component: VBox,
      boxShadow: '-2px 0px 3px -1px #E2E2E2',
      flex: 1,
    }
  }

  constructor(props) {
    super(props);
    let {path, actions, initialContext} = props;
    let execution = Execution.start(actions, path, initialContext);
    this.state = {execution};
  }

  render() {
    let {execution} = this.state;
    let action = React.cloneElement(execution.position.element, {
      context: execution.position.context,
      onCommand: this._onCommand.bind(null, execution.position),
    });
    let {ActionPanel} = this.stylesheet;
    return (
      <HBox flex={1}>
        <Sidebar width={300}>
          {execution.trace.length > 2 &&
            <ContextToolbar
              execution={execution}
              onClick={this._onReturn}
              />}
          <NavigationToolbar
            onReplace={this._onReplace.bind(null, execution.position.keyPath)}
            onNext={this._onNext}
            execution={execution}
            />
        </Sidebar>
        <ActionPanel flex={1}>
          {action}
        </ActionPanel>
      </HBox>
    );
  }

  @autobind
  _onNext(action) {
    this.setState(state => ({
      execution: Execution.advance(state.execution, action)
    }));
  }

  @autobind
  _onReturn(action) {
    this.setState(state => ({
      execution: Execution.returnToAction(state.execution, action)
    }));
  }

  @autobind
  _onReplace(action, nextAction) {
    this.setState(state => ({
      execution: Execution.replace(state.execution, action, nextAction, false)
    }));
  }

  @autobind
  _onClose(action) {
    this.setState(state => ({
      execution: Execution.close(state.execution, action)
    }));
  }

  @autobind
  _onCommand(position, commandName, ...args) {
    this.setState(state => {
      let execution = state.execution;
      // if position from which command originates differs from the current
      // execution position then close all further action panels.
      if (state.execution.position.keyPath !== position.keyPath) {
        let nextActionIdx = state.execution.indexOf(position.keyPath) + 1;
        let nextAction = state.execution.trace[nextActionIdx].keyPath;
        execution = Execution.close(execution, nextAction);
      }
      execution = Execution.executeCommandAtCurrentPosition(
        state.execution,
        commandName,
        ...args);
      return {...state, execution};
    });
  }
}
