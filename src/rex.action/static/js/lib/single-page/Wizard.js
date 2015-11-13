/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind           from 'autobind-decorator';
import emptyFunction      from 'empty/function'
import * as Stylesheet    from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}       from '@prometheusresearch/react-box';
import React              from 'react';
import Execution          from '../execution/Execution';
import Command            from '../execution/Command';
import Sidebar            from './Sidebar';
import ContextToolbar     from './ContextToolbar';
import NavigationToolbar  from './NavigationToolbar';

@Stylesheet.styleable
export default class Wizard extends React.Component {

  static defaultProps = {
    title: 'Wizard',
    icon: 'asterisk',
    renderTopSidebarItem: emptyFunction,
  };

  static stylesheet = Stylesheet.createStylesheet({
    ActionPanel: {
      Component: VBox,
      boxShadow: '-2px 0px 3px -1px #E2E2E2',
      flex: 1,
    }
  });

  static renderTitle(props, context) {
    return props.title;
  }

  static getTitle(props) {
    return props.title;
  }

  constructor(props) {
    super(props);
    let {path, initialContext} = props;
    let execution = Execution.create(path, initialContext);
    this.state = {execution};
  }

  render() {
    let {execution} = this.state;
    let action = React.cloneElement(execution.position.element, {
      key: execution.position.key,
      context: execution.position.context,
      actionState: execution.position.state,
      setActionState: this._onState.bind(null, execution.position),
      onCommand: this._onCommand.bind(null, execution.position),
      onContext: this._onContext.bind(null, execution.position),
      onEntityUpdate: this._onEntityUpdate,
    });
    let {ActionPanel} = this.stylesheet;
    return (
      <HBox flex={1}>
        <Sidebar width={300}>
          {this.props.renderTopSidebarItem()}
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
      execution: state.execution.advance(action)
    }));
  }

  @autobind
  _onReturn(action) {
    this.setState(state => ({
      execution: state.execution.returnToAction(action)
    }));
  }

  @autobind
  _onReplace(action, nextAction) {
    this.setState(state => ({
      execution: state.execution.replace(action, nextAction, false)
    }));
  }

  @autobind
  _onClose(action) {
    this.setState(state => ({
      execution: state.execution.close(action)
    }));
  }

  @autobind
  _onCommand(position, commandName, ...args) {
    this.setState(state => {
      let {execution} = state;
      // if position from which command originates differs from the current
      // execution position then close all further action panels.
      if (state.execution.position.keyPath !== position.keyPath) {
        let nextActionIdx = state.execution.indexOf(position.keyPath) + 1;
        let nextAction = state.execution.trace[nextActionIdx].keyPath;
        execution = execution.close(nextAction);
      }
      execution = state.execution.executeCommandAtCurrentPosition(
        commandName,
        ...args);
      return {...state, execution};
    });
  }

  @autobind
  _onState(position, stateUpdate) {
    this.setState(state => {
      let {execution} = state;
      execution = execution.setState(position, stateUpdate);
      return {...state, execution};
    });
  }

  @autobind
  _onContext(position, context) {
    let commandName = Command.onContextCommand.name;
    return this._onCommand(position, commandName, context)
  }

  @autobind
  _onEntityUpdate(prevEntity, nextEntity) {
    this.setState(state => {
      let {execution} = state;
      execution = execution.updateEntity(prevEntity, nextEntity);
      return {...state, execution};
    });
  }

}
