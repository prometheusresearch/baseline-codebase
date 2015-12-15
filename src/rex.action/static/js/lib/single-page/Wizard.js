/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import emptyFunction from 'empty/function'
import * as Stylesheet from '@prometheusresearch/react-stylesheet';
import {VBox, HBox} from '@prometheusresearch/react-box';
import React from 'react';
import Graph from '../execution/Graph';
import * as Command from '../execution/Command';
import Sidebar from './Sidebar';
import ContextToolbar from './ContextToolbar';
import NavigationToolbar from './NavigationToolbar';

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
    let graph = Graph.create(path, initialContext);
    this.state = {graph};
  }

  render() {
    let {graph} = this.state;
    let action = React.cloneElement(graph.node.element, {
      key: graph.node.key,
      context: graph.node.context,
      actionState: graph.node.state,
      setActionState: this._onState.bind(null, graph.node),
      onCommand: this._onCommand.bind(null, graph.node),
      onContext: this._onContext.bind(null, graph.node),
      onEntityUpdate: this._onEntityUpdate,
    });
    let {ActionPanel} = this.stylesheet;
    return (
      <HBox flex={1}>
        <Sidebar width={300}>
          {this.props.renderTopSidebarItem()}
          {graph.trace.length > 2 &&
            <ContextToolbar
              graph={graph}
              onClick={this._onReturn}
              />}
          <NavigationToolbar
            onReplace={this._onReplace.bind(null, graph.node.keyPath)}
            onNext={this._onNext}
            graph={graph}
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
      graph: state.graph.advance(action)
    }));
  }

  @autobind
  _onReturn(action) {
    this.setState(state => ({
      graph: state.graph.returnTo(action)
    }));
  }

  @autobind
  _onReplace(action, nextAction) {
    this.setState(state => ({
      graph: state.graph.replace(action, nextAction, false)
    }));
  }

  @autobind
  _onClose(action) {
    this.setState(state => ({
      graph: state.graph.close(action)
    }));
  }

  @autobind
  _onCommand(node, commandName, ...args) {
    this.setState(state => {
      let {graph} = state;
      // if node from which command originates differs from the current
      // graph node then close all further action panels.
      if (state.graph.node.keyPath !== node.keyPath) {
        let nextActionIdx = state.graph.indexOf(node.keyPath) + 1;
        let nextAction = state.graph.trace[nextActionIdx].keyPath;
        graph = graph.close(nextAction);
      }
      graph = state.graph.executeCommandAtCurrentNode(
        commandName,
        ...args);
      return {...state, graph};
    });
  }

  @autobind
  _onState(node, stateUpdate) {
    this.setState(state => {
      let {graph} = state;
      graph = graph.setState(node, stateUpdate);
      return {...state, graph};
    });
  }

  @autobind
  _onContext(node, context) {
    let commandName = Command.onContextCommand.name;
    return this._onCommand(node, commandName, context)
  }

  @autobind
  _onEntityUpdate(prevEntity, nextEntity) {
    this.setState(state => {
      let {graph} = state;
      graph = graph.updateEntity(prevEntity, nextEntity);
      return {...state, graph};
    });
  }

}
