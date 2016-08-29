/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import emptyFunction from 'empty/function';
import createHistory from 'history/lib/createHashHistory';
import React from 'react';

import {post} from 'rex-widget/lib/fetch';
import * as Stylesheet from 'rex-widget/stylesheet';
import * as layout  from 'rex-widget/layout';

import {isEntity, getEntityType} from '../Entity';
import * as GraphPath from '../GraphPath';
import {Command} from '../execution';
import ActionContext from '../ActionContext';
import {confirmNavigation} from '../ConfirmNavigation';

import Breadcrumb from './Breadcrumb';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';

/* istanbul ignore next */
function isFirefox() {
  return navigator.userAgent.search('Firefox') > -1;
}

export default class Wizard extends React.Component {

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
    }
  });

  static renderTitle({title}) {
    return title;
  }

  static getTitle(props) {
    return props.title;
  }

  constructor(props) {
    super(props);
    let {path, pathPrefix, actions, initialContext, createHistory} = props;
    this._initialContext = initialContext;
    this._history = createHistory();
    this._historyStopListen = null;

    let location = null;
    this._history.listen(loc => location = loc)();
    let pathname = normalizePathname(location.pathname, pathPrefix);
    let graph = GraphPath.fromPath(
      pathname,
      path,
      actions,
      this._initialContext,
      this.props.domain,
    );
    this.state = {graph};
  }

  render() {
    let {graph} = this.state;
    let action = React.cloneElement(graph.node.element, {
      key: graph.node.key,
      context: graph.node.context,
      actionState: graph.node.state,
      setActionState: this._onState.bind(null, graph.node),
      onCommand: this._onCommand.bind(null, true, graph.node),
      onContext: this._onContext.bind(null, graph.node),
      onContextNoAdvance: this._onContextNoAdvance.bind(null, graph.node),
      onEntityUpdate: this._onEntityUpdate,
      refetch: () => this._refetch(),
      toolbar: <Toolbar graph={graph} onClick={this._onNext} />,
    });
    let {ActionPanel} = this.constructor.stylesheet;
    let showBreadcrumb = (
      this.props.settings.includePageBreadcrumbItem ||
      graph.trace.length > 2
    );
    return (
      <layout.VBox flex={1} direction="column-reverse">
        <layout.HBox flex={1}>
          <Sidebar
            graph={graph}
            onClick={this._onReplace.bind(null, graph.node.keyPath)}
            />
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

  componentDidMount() {
    this._historyStopListen = this._history.listen(this._onLocation);
  }

  componentDidUpdate(_prevProps, prevState) {
    if (prevState.graph !== this.state.graph) {
      let path = GraphPath.toPath(this.state.graph);
      if (path === GraphPath.toPath(prevState.graph)) {
        this._history.replaceState(null, this.props.pathPrefix + path);
      } else {
        this._history.pushState(null, this.props.pathPrefix + path);
      }
    }
  }

  componentWillUnmount() {
    if (this._historyStopListen) {
      this._historyStopListen();
    }
    this._history = null;
    this._historyStopListen = null;
  }

  @autobind
  _refetch(graph = this.state.graph) {
    let data = {};
    graph.trace.forEach(node => {
      data[node.keyPath] = {};
      Object.keys(node.context).forEach(key => {
        let value = node.context[key];
        data[node.keyPath][key] = isEntity(value) ?
          {id: value.id, type: getEntityType(value)} :
          value;
      });
    });
    post(this.props.data, null, JSON.stringify(data))
      .then(this._onRefetchComplete, this._onRefetchError);
  }

  @autobind
  _onRefetchComplete(data) {
    let trace = [];
    for (let i = 0; i < this.state.graph.trace.length; i++) {
      let node = this.state.graph.trace[i];
      node = node.setContext(data[node.keyPath]);
      if (!node.isAllowed) {
        break;
      }
      trace.push(node);
    }
    let graph = this.state.graph.replaceTrace(trace);
    this.setState({graph});
  }

  @autobind
  _onRefetchError(err) {
    console.error(err); // eslint-disable-line no-console
  }

  @autobind
  _onLocation(location) {
    if (location.action !== 'POP') {
      return;
    }

    let {pathPrefix} = this.props;
    let path = GraphPath.toPath(this.state.graph);

    let pathname = location.pathname;

    if (isFirefox()) {
      pathname = decodeURIComponent(pathname);
    }

    pathname = normalizePathname(pathname, pathPrefix);

    if (path === pathname) {
      return;
    }

    let graph = GraphPath.fromPath(
      pathname,
      this.props.path,
      this.props.actions,
      this._initialContext,
      this.props.domain,
    );

    this.setState({graph});
  }

  @autobind
  _onNext(action) {
    this.setStateConfirmed(state => ({
      graph: state.graph.advance(action)
    }));
  }

  @autobind
  _onReturn(action) {
    this.setStateConfirmed(state => ({
      graph: state.graph.returnTo(action)
    }));
  }

  @autobind
  _onReplace(action, nextAction) {
    this.setStateConfirmed(state => ({
      graph: state.graph.replace(action, nextAction, false)
    }));
  }

  @autobind
  _onCommand(advance, node, commandName, ...args) {
    this.setStateConfirmed(state => {
      let {graph} = state;
      // if node from which command originates differs from the current
      // graph node then close all further action panels.
      if (state.graph.node.keyPath !== node.keyPath) {
        let nextActionIdx = state.graph.indexOf(node.keyPath) + 1;
        let nextAction = state.graph.trace[nextActionIdx].keyPath;
        graph = graph.close(nextAction);
      }
      if (advance) {
        graph = state.graph.executeCommandAtCurrentNode(
          commandName,
          ...args);
      } else {
        graph = state.graph.executeCommandAtCurrentNodeAndNoAdvance(
          commandName,
          ...args);
      }
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
    return this._onCommand(true, node, commandName, context);
  }

  @autobind
  _onContextNoAdvance(node, context) {
    let commandName = Command.onContextCommand.name;
    return this._onCommand(false, node, commandName, context);
  }

  @autobind
  _onEntityUpdate(prevEntity, nextEntity) {
    this.setState(state => {
      let {graph} = state;
      graph = graph.updateEntity(prevEntity, nextEntity);
      this._refetch(graph);
      return {...state, graph};
    });
  }

  setStateConfirmed(setter) {
    if (confirmNavigation()) {
      this.setState(setter);
    }
  }

}


function normalizePathname(pathname, prefix = '') {
  if (prefix && prefix === pathname.slice(0, prefix.length)) {
    pathname = pathname.slice(prefix.length);
  }
  return pathname;
}
