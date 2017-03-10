/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import emptyFunction from 'empty/function';
import createHistory from 'history/lib/createHashHistory';
import invariant from 'invariant';
import React from 'react';

//import {post} from 'rex-widget/lib/fetch';
import * as Stylesheet from 'rex-widget/stylesheet';
import * as layout from 'rex-widget/layout';

//import {isEntity, getEntityType} from '../Entity';
import {Command} from '../execution';
import ActionContext from '../ActionContext';
import {confirmNavigation} from '../ConfirmNavigation';

import Breadcrumb from './Breadcrumb';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
//import * as Environment from '../Environment';
import * as S from '../execution/State';
import * as SP from '../execution/StatePath';
import type {State} from '../execution/State';
import {type PreInstruction, parseInstruction} from '../parseInstruction';
import type {Entity} from '../types';

type WizardProps = {
  path: PreInstruction[],
  domain: Object,
  actions: Object,
  initialContext: ?Object,
  settings: {includePageBreadcrumbItem?: boolean},
};

type WizardState = {
  graph: State,
};

export default class Wizard extends React.Component {
  props: WizardProps;
  state: WizardState;

  static defaultProps = {
    title: 'Wizard',
    icon: 'asterisk',
    renderTopSidebarItem: emptyFunction,
    createHistory,
    settings: {},
    pathPrefix: '',
  };

  static stylesheet = Stylesheet.create({
    ActionPanel: {
      Component: layout.VBox,
      flex: 1,
    },
  });

  static renderTitle({title}) {
    return title;
  }

  static getTitle(props) {
    return props.title;
  }

  constructor(props: WizardProps) {
    super(props);
    let {domain, path, actions, initialContext} = props;
    let instruction = parseInstruction(domain, actions, path);
    let graph = SP.fromPath('/', {
      instruction,
      context: initialContext || {},
    });
    this.state = {graph};
  }

  render() {
    const {graph} = this.state;
    const {position} = graph;
    invariant(position != null, 'Invalid state');
    const action = React.cloneElement(position.instruction.action.element, {
      key: position.instruction.action.id,
      context: position.context,
      actionState: position.state,
      setActionState: this._onState,
      onCommand: this._onCommand.bind(null, true),
      onContext: this._onContext,
      onContextNoAdvance: this._onContextNoAdvance,
      onEntityUpdate: this._onEntityUpdate,
      refetch: () => this._refetch(this.state.graph),
      toolbar: <Toolbar graph={graph} onClick={this._onNext} />,
    });
    let {ActionPanel} = this.constructor.stylesheet;
    let showBreadcrumb = this.props.settings.includePageBreadcrumbItem ||
      position.trace.length > 0;
    return (
      <layout.VBox flex={1} direction="column-reverse">
        <layout.HBox flex={1}>
          <Sidebar graph={graph} onClick={this._onReplaceWithSibling} />
          <ActionPanel flex={1}>
            <ActionContext
              help={action.props.help}
              toolbar={<Toolbar graph={graph} onClick={this._onNext} />}>
              {action}
            </ActionContext>
          </ActionPanel>
        </layout.HBox>
        {showBreadcrumb &&
          <Breadcrumb
            includePageBreadcrumbItem={this.props.settings.includePageBreadcrumbItem}
            graph={graph}
            onClick={this._onReturn}
          />}
      </layout.VBox>
    );
  }

  //componentDidMount() {
  //  //this._historyStopListen = this._history.listen(this._onLocation);
  //}

  //componentDidUpdate(_prevProps, prevState) {
  //  if (prevState.graph !== this.state.graph) {
  //    let path = GraphPath.toPath(this.state.graph);
  //    if (path === GraphPath.toPath(prevState.graph)) {
  //      this._history.replaceState(null, this.props.pathPrefix + path);
  //    } else {
  //      this._history.pushState(null, this.props.pathPrefix + path);
  //    }
  //  }
  //}

  //  componentWillUnmount() {
  //if (this._historyStopListen) {
  //  this._historyStopListen();
  //}
  //this._history = null;
  //this._historyStopListen = null;
  //  }

  _refetch = (_graph: State) => {
    //let data = {};
    //graph.trace.forEach(node => {
    //  data[node.keyPath] = {};
    //  Object.keys(node.context).forEach(key => {
    //    let value = node.context[key];
    //    data[node.keyPath][key] = isEntity(value)
    //      ? {id: value.id, type: getEntityType(value)}
    //      : value;
    //  });
    //});
    //post(this.props.data, null, JSON.stringify(data)).then(
    //  this._onRefetchComplete,
    //  this._onRefetchError,
    //);
  };
  //
  //_onRefetchComplete = data => {
  //  let trace = [];
  //  for (let i = 0; i < this.state.graph.trace.length; i++) {
  //    let node = this.state.graph.trace[i];
  //    node = node.setContext(data[node.keyPath]);
  //    if (!node.isAllowed) {
  //      break;
  //    }
  //    trace.push(node);
  //  }
  //  let graph = this.state.graph.replaceTrace(trace);
  //  this.setState({graph});
  //};

  //_onRefetchError = err => {
  //  console.error(err); // eslint-disable-line no-console
  //};

  //_onLocation = location => {
  //  if (location.action !== 'POP') {
  //    return;
  //  }
  //
  //  let {pathPrefix} = this.props;
  //  let path = GraphPath.toPath(this.state.graph);
  //
  //  let pathname = location.pathname;
  //
  //  if (Environment.isFirefox()) {
  //    pathname = decodeURIComponent(pathname);
  //  }
  //
  //  pathname = normalizePathname(pathname, pathPrefix);
  //
  //  if (path === pathname) {
  //    return;
  //  }
  //
  //  let graph = GraphPath.fromPath(
  //    pathname,
  //    this.props.path,
  //    this.props.actions,
  //    this._initialContext,
  //    this.props.domain,
  //  );
  //
  //  this.setState({graph});
  //};

  _onNext = (actionId: string) => {
    this.setStateConfirmed(state => ({
      graph: S.advanceTo(state.graph, actionId),
    }));
  };

  _onReturn = (actionId: string) => {
    this.setStateConfirmed(state => ({
      graph: S.returnTo(state.graph, actionId),
    }));
  };

  _onReplaceWithSibling = (siblingActionId: string) => {
    this.setStateConfirmed(state => ({
      graph: S.replaceCurrentPositionWithSibling(state.graph, siblingActionId),
    }));
  };

  _onState = (stateUpdate: Object) => {
    this.setState(state => {
      const graph = S.setStateAtCurrentPosition(state.graph, stateUpdate);
      return {...state, graph};
    });
  };

  _onCommand = (advance: boolean, commandName: string, ...args: any[]) => {
    this.setStateConfirmed(state => {
      let {graph} = state;
      graph = S.applyCommandAtCurrentPosition(graph, commandName, args);
      if (advance) {
        graph = S.advanceToFirst(graph);
      }
      return {...state, graph};
    });
  };

  _onContext = (context: Object) => {
    let commandName = Command.onContextCommand.name;
    return this._onCommand(true, commandName, context);
  };

  _onContextNoAdvance = (context: Object) => {
    let commandName = Command.onContextCommand.name;
    return this._onCommand(false, commandName, context);
  };

  _onEntityUpdate = (_prevEntity: Entity, _nextEntity: Entity) => {
    //this.setState(state => {
    //  let {graph} = state;
    //  graph = graph.updateEntity(prevEntity, nextEntity);
    //  this._refetch(graph);
    //  return {...state, graph};
    //});
  };

  setStateConfirmed = (setter: (WizardState) => WizardState) => {
    if (confirmNavigation()) {
      this.setState(setter);
    }
  };
}

//function normalizePathname(pathname, prefix = '') {
//  if (prefix && prefix === pathname.slice(0, prefix.length)) {
//    pathname = pathname.slice(prefix.length);
//  }
//  return pathname;
//}
