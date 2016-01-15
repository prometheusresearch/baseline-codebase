/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import emptyFunction from 'empty/function'
import {createLocation} from 'history';
import createHistory from 'history/lib/createHashHistory';
import React from 'react';

import {post} from 'rex-widget/lib/fetch'
import * as Stylesheet from 'rex-widget/stylesheet';
import * as layout  from 'rex-widget/layout';
import * as ui from 'rex-widget/ui';
import * as css from 'rex-widget/css';

import Graph from '../execution/Graph';
import {isEntity, getEntityType} from '../Entity';
import * as GraphPath from '../GraphPath';
import * as Command from '../execution/Command';
import * as Instruction from '../execution/Instruction';
import {getTitleAtNode} from '../ActionTitle';
import {getIconAtNode} from '../ActionIcon';
import ActionContext from '../ActionContext';

import Breadcrumb from './Breadcrumb';
import Sidebar from './Sidebar';

function groupBy(array, keyFunc) {
  let result = [];
  let currentArray = [];
  let currentKey = {}; // sentinel
  for (let i = 0; i < array.length; i++) {
    let item = array[i];
    let key = keyFunc(item);
    if (key === currentKey) {
      currentArray.push(item);
    } else {
      if (currentArray.length > 0) {
        result.push(currentArray);
      }
      currentArray = [item];
      currentKey = key;
    }
  }
  if (currentArray.length > 0) {
    result.push(currentArray);
  }
  return result;
}

function NextActionButton({node, onClick, groupHorizontally}) {
  let Button;
  switch (node.element.props.kind) {
    case 'success':
      Button = ui.SuccessButton;
      break;
    case 'danger':
      Button = ui.DangerButton;
      break;
    default:
      Button = ui.Button;
  }
  return (
    <Button
      size="small"
      onClick={onClick.bind(null, node.keyPath)}
      icon={getIconAtNode(node)}
      variant={{groupHorizontally}}>
      {getTitleAtNode(node)}
    </Button>
  );
}

function Toolbar({graph, onClick}) {
  let nodes = groupBy(
    graph.nextActions().filter(node => !Instruction.Replace.is(node.instruction)),
    node => node.element.props.kind);
  let buttonGroups = nodes
    .map((nodes, idx) =>
      <layout.HBox marginRight={5} marginBottom={5} key={idx}>
        {nodes.map(node =>
          <NextActionButton
            key={node.keyPath}
            node={node}
            groupHorizontally={nodes.length > 1}
            onClick={onClick}
            />)}
      </layout.HBox>
    );
  return <layout.HBox wrap="wrap">{buttonGroups}</layout.HBox>
}

@Stylesheet.attach
export default class Wizard extends React.Component {

  static defaultProps = {
    title: 'Wizard',
    icon: 'asterisk',
    renderTopSidebarItem: emptyFunction,
  };

  static stylesheet = Stylesheet.create({
    ActionPanel: {
      Component: layout.VBox,
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
    this._initialContext = initialContext;
    this._history = createHistory();
    this._historyStopListen = null;

    let location = null;
    this._history.listen(loc => location = loc)();
    let graph = GraphPath.fromPath(location.pathname, path, this._initialContext);
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
      refetch: this._refetch,
      toolbar: <Toolbar graph={graph} onClick={this._onNext} />,
    });
    let {ActionPanel} = this.stylesheet;
    return (
      <layout.VBox flex={1} direction="column-reverse">
        <layout.HBox flex={1}>
          <Sidebar
            graph={graph}
            onClick={this._onReplace.bind(null, graph.node.keyPath)}
            />
          <ActionPanel flex={1}>
            <ActionContext toolbar={<Toolbar graph={graph} onClick={this._onNext} />}>
              {action}
            </ActionContext>
          </ActionPanel>
        </layout.HBox>
        {graph.trace.length > 2 &&
          <Breadcrumb
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
      this._history.pushState(null, path);
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
  _refetch() {
    let graph = this.state.graph;
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
    let graph = new Graph(trace);
    this.setState({graph});
  }

  @autobind
  _onRefetchError(err) {
    console.error(err);
  }

  @autobind
  _onLocation(location) {
    if (location.action === 'POP') {
      let graph = GraphPath.fromPath(
        location.pathname,
        this.props.path,
        this._initialContext
      );
      this.setState({graph});
    }
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
