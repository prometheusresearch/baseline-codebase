/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind           from 'autobind-decorator';
import invariant          from 'invariant';
import React, {PropTypes} from 'react';
import RexWidget          from 'rex-widget';
import {VBox, HBox}       from 'rex-widget/lib/Layout';
import {translate3d}      from 'rex-widget/lib/StyleUtils';
import WithDOMSize        from 'rex-widget/lib/WithDOMSize';

import * as Command       from '../execution/Command';
import * as GraphPath from '../GraphPath';
import Component          from '../StatefulComponent';
import HistoryAware       from '../HistoryAware';

import Panel              from './Panel';
import ActionPanel        from './ActionPanel';
import ServicePanel       from './ServicePanel';
import Breadcrumb         from './Breadcrumb';
import Style              from './Wizard.style';

const DEFAULT_ACTION_WIDTH = 480;

function getWidthAtNode(node, defaultWidth = DEFAULT_ACTION_WIDTH) {
  let element = node.element;
  if (element.props.width) {
    return element.props.width;
  } else if (element.type.getDefaultProps) {
    return element.type.getDefaultProps().width;
  } else {
    return defaultWidth;
  }
}

@WithDOMSize
@HistoryAware
export default class Wizard extends Component {

  static propTypes = {
    /**
     * A path of possible wizard transitions.
     */
    path: PropTypes.object.isRequired,

    /**
     * A mapping from id to a React element which represents an action.
     */
    actions: PropTypes.object.isRequired,

    /**
     * Initial context, it is set to {} (empty context if it's not supplied).
     */
    initialContext: PropTypes.object,

    /**
     * Boolean flag which disables history for wizard if set to true.
     */
    disableHistory: PropTypes.bool,

    /**
     * Breadcrumb configuration.
     */
    breadcrumb: PropTypes.oneOf(['bottom', 'top', 'none']),
  };

  static defaultProps = {
    breadcrumb: 'bottom',
  };

  constructor(props) {
    super(props);
    this._pushedPath = null;
    let graph = null;
    let metrics = {
      size: null,
      focus: null,
      translateX: 0,
      visibleNode: []
    };
    if (props.disableHistory) {
      graph = GraphPath.fromPath(
        props.location.pathname,
        props.path,
        props.initialContext // initialContext can't be changed
      );
      metrics = {...metrics, focus: graph.trace[1].keyPath};
    }
    this.state = {
      graph,
      metrics
    };
  }

  render() {
    let {location, breadcrumb} = this.props;
    let {metrics, graph} = this.state;
    if (metrics.size === null || location === null) {
      return <VBox className={Style.self} />;
    } else {
      return (
        <VBox size={1} className={Style.self}>
          {breadcrumb === 'top' && this.renderBreadcrumb()}
          <VBox size={1} className={Style.items}>
            <HBox
              size={1}
              className={Style.itemsCanvas}
              style={{transform: translate3d(-metrics.translateX, 0, 0)}}>
              {graph.trace.slice(1).map((pos, idx) =>
                <ActionPanel
                  graph={graph}
                  node={pos}
                  key={pos.key}
                  active={metrics.visibleNode.indexOf(pos.keyPath) > -1}
                  className={Style.item}
                  style={{zIndex: 1000}}
                  onReplace={this.scheduleCommand(this.replace, pos.keyPath)}
                  onEntityUpdate={this.scheduleCommand(this.entityUpdate)}
                  onState={this.scheduleCommand(this.onState)}
                  onCommand={this.scheduleCommand(this.executeActionCommand)}
                  onContext={this.scheduleCommand(this.onContext)}
                  onClose={idx > 0 ?
                    this.scheduleCommand(this.close, pos.keyPath) :
                    undefined}
                  onFocus={this.scheduleCommand(this.focus)}
                  />)}
              <ServicePanel
                key="service"
                active={metrics.visibleNode.indexOf(ServicePanel.id) > -1}
                className={Style.item}
                onFocus={this.scheduleCommand(this.ensureIsInViewport)}
                style={{zIndex: 999}}
                graph={graph}
                wizard={this}
                />
            </HBox>
          </VBox>
          {breadcrumb === 'bottom' && this.renderBreadcrumb()}
        </VBox>
      );
    }
  }

  renderBreadcrumb() {
    let {metrics, graph} = this.state;
    return (
      <VBox className={Style.breadcrumb}>
        <Breadcrumb
          graph={graph}
          metrics={metrics}
          onClick={this._onBreadcrumbClick}
          />
      </VBox>
    );
  }

  componentWillReceiveProps(nextProps) {
    this.executeCommand(this._onNextProps(nextProps));
  }

  @Component.command
  _onNextProps(state, nextProps) {
    if (
      nextProps.location && this.props.location === null ||
      nextProps.location.action === 'POP' &&
      nextProps.location.pathname !== this.props.location.pathname
    ) {
      let graph = GraphPath.fromPath(
        nextProps.location.pathname,
        nextProps.path,
        this.props.initialContext // initialContext can't be changed
      );
      let metrics = {...state.metrics, focus: graph.trace[1].keyPath};
      state = {...state, graph, metrics};
      if (this.props.DOMSize) {
        state = this.setSize(this.props.DOMSize)(state);
        state = this.ensureIsInViewport(state.graph.node.keyPath)(state);
      }
    }
    if (nextProps.DOMSize !== this.props.DOMSize) {
      if (this.props.DOMSize === null && nextProps.DOMSize) {
        state = this.setSize(nextProps.DOMSize)(state);
        state = this.ensureIsInViewport(state.graph.node.keyPath)(state);
      } else {
        state = this.setSize(nextProps.DOMSize)(state);
      }
    }
    return state;
  }

  _pushGraphToPath(graph) {
    if (this.props.disableHistory) {
      return;
    }
    let path = GraphPath.toPath(graph);
    if (this._pushedPath !== path) {
      this._pushedPath = path;
      this.props.history.pushState(null, path);
    }
  }

  @autobind
  _onBreadcrumbClick(action) {
    let {graph, metrics} = this.state;
    let actions = graph.trace.map(pos => pos.keyPath);
    if (this.isInViewport(this.state, action)) {
      let focusIdx = actions.indexOf(metrics.focus);
      let idx = actions.indexOf(action);
      if (idx < focusIdx) {
        this.executeCommand(this.moveFocus(-1));
      } else if (idx > focusIdx) {
        this.executeCommand(this.moveFocus(1));
      }
    } else {
      this.executeCommand(this.ensureIsInViewport(action));
    }
  }

  @Component.command
  executeActionCommand(state, node, commandName, ...args) {
    // if node from which command originates differs from the current
    // graph node then close all further action panels.
    if (state.graph.node.keyPath !== node.keyPath) {
      let nextActionIdx = state.graph.indexOf(node.keyPath) + 1;
      let nextAction = state.graph.trace[nextActionIdx].keyPath;
      state = this._close(nextAction)(state);
    }
    let graph = state.graph.executeCommandAtCurrentNode(
        commandName,
        ...args);
    state = {...state, graph};
    state = this.updateMetrics()(state);
    state = this.ensureIsInViewport(state.graph.node.keyPath)(state);
    this._pushGraphToPath(graph);
    return state;
  }

  @Component.command
  onContext(state, node, context) {
    return this.executeActionCommand(
      node,
      Command.onContextCommand.name,
      context
    )(state);
  }

  @Component.command
  onState(state, node, stateUpdate) {
    let graph = state.graph.setState(node, stateUpdate);
    return {...state, graph};
  }

  @Component.command
  entityUpdate(state, prevEntity, nextEntity) {
    let {graph} = state;
    graph = graph.updateEntity(prevEntity, nextEntity);
    state = {...state, graph};
    state = this.updateMetrics(state.graph.node.keyPath)(state);
    state = this.ensureIsInViewport(state.graph.node.keyPath)(state);
    this._pushGraphToPath(state.graph);
    return state;
  }

  @Component.command
  advanceTo(state, action, contextUpdate = {}) {
    let graph = state.graph.advance(action, contextUpdate);
    state = {...state, graph};
    state = this.updateMetrics()(state);
    state = this.ensureIsInViewport(state.graph.node.keyPath)(state);
    this._pushGraphToPath(state.graph);
    return state;
  }

  @Component.command
  replace(state, action, nextAction) {
    let idx = state.graph.indexOf(state.metrics.focus);
    let graph = state.graph.replace(action, nextAction);
    let newFocus = graph.trace[idx] ?
      graph.trace[idx].keyPath:
      graph.node.keyPath;
    state = {...state, graph};
    state = this.focus(newFocus)(state);
    state = this.ensureIsInViewport(nextAction)(state);
    this._pushGraphToPath(state.graph);
    return state;
  }

  /**
   * Put focus on a specified action.
   */
  @Component.command
  focus(state, action) {
    return this.updateMetrics(action)(state);
  }

  @Component.command
  updateMetrics(state, focus) {
    focus = focus || state.metrics.focus;
    let panels = state.graph.trace.slice(1)
      .map(node => _computePanelMetrics(state.graph, node))
      .concat({action: ServicePanel.id, width: 150});
    let metrics = _computeCanvasMetrics(panels, focus, state.metrics.size);
    return {...state, metrics};
  }

  @Component.command
  close(state, action) {
    state = this._close(action)(state);
    this._pushGraphToPath(state.graph);
    return state;
  }


  /**
   * Close panel with the given action.
   */
  @Component.command
  _close(state, action) {
    let graph = state.graph.close(action);
    state = {...state, graph};
    state = this.focus(graph.node.keyPath)(state);
    return state;
  }

  /**
   * Ensure that given action is in the viewport.
   */
  @Component.command
  ensureIsInViewport(state, action) {
    let actions = state.graph.trace
      .map(pos => pos.keyPath)
      .concat(ServicePanel.id);
    let idx = actions.indexOf(action);
    invariant(
      actions.indexOf(state.metrics.focus) > -1,
      'invalid focus "%s"', state.metrics.focus
    );
    invariant(
      action !== null && idx > -1,
      'action "%s" is not active', action
    );
    while (!this.isInViewport(state, action)) {
      if (actions.indexOf(state.metrics.focus) < idx) {
        state = this.moveFocus(1)(state);
      } else if (actions.indexOf(state.metrics.focus) > idx) {
        state = this.moveFocus(-1)(state);
      } else {
        break;
      }
    }
    return state;
  }

  /**
   * Check if given action is in the viewport.
   */
  @autobind
  isInViewport(state, keyPath) {
    return state.metrics.visibleNode.indexOf(keyPath) > -1;
  }

  /**
   * Move current focus of the wizard.
   */
  @Component.command
  moveFocus(state, delta) {
    let {graph, metrics} = state;
    let actions = graph.trace.map(pos => pos.keyPath);
    let idx = actions.indexOf(metrics.focus);
    let nextIdx = idx + delta;
    if (nextIdx >= 0 && nextIdx < actions.length) {
      let newFocus = actions[nextIdx];
      state = this.focus(newFocus)(state);
    }
    return state;
  }

  @Component.command
  setSize(state, size) {
    let metrics = {...state.metrics, size};
    state = {...state, metrics};
    state = this.updateMetrics(undefined)(state);
    state = this.ensureIsInViewport(state.graph.node.keyPath)(state);
    return state;
  }

}

function _computePanelMetrics(graph, node) {
  var width = getWidthAtNode(node) || 300 // Panel.Style.self.minWidth;
  if (graph.siblingActions(node).length > 0) {
    width = width + 150; // Panel.Style.sidebar.width
  }
  return {width, action: node.keyPath};
}

function _computeCanvasMetrics(panels, focus, size) {
  let widthToDistribute;
  let seenWidth = 0;
  let scrollToIdx;
  let translateX = 0;
  let visibleNode = [];

  for (let i = 0; i < panels.length; i++) {
    let panel = panels[i];
    if (panel.action === focus) {
      scrollToIdx = i;
      widthToDistribute = size.width;
    }
    if (widthToDistribute !== undefined) {
      widthToDistribute = widthToDistribute - panel.width;
      if (widthToDistribute >= 0) {
        visibleNode.push(panel.action);
      } else {
        break;
      }
    }
  }
  if (scrollToIdx > 0) {
    for (let i = scrollToIdx - 1; i >= 0; i--) {
      let panel = panels[i];
      translateX = translateX + panel.width + 15 /*WizardStyle.item.marginRight*/;
    }
  }

  translateX = Math.max(0, translateX - 15 /*WizardStyle.item.marginRight*/ * 4);

  return {
    focus,
    translateX,
    visibleNode,
    size
  };
}
