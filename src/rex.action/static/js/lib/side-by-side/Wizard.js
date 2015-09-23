/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind           from 'autobind-decorator';
import invariant          from 'invariant';
import React, {PropTypes} from 'react';
import RexWidget          from 'rex-widget';
import {VBox, HBox}       from 'rex-widget/lib/Layout';
import {translate3d}      from 'rex-widget/lib/StyleUtils';

import {getWidth}         from '../actions';
import WithDOMSize        from '../WithDOMSize';
import * as ActionCommand from '../ActionCommand';
import * as Execution     from '../Execution';
import * as ExecutionPath from '../ExecutionPath';
import Component          from '../StatefulComponent';
import HistoryAware       from '../HistoryAware';

import Panel              from './Panel';
import ActionPanel        from './ActionPanel';
import ServicePanel       from './ServicePanel';
import WizardBreadcrumb   from './WizardBreadcrumb';
import Style              from './Wizard.style';

window.React = React;

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
    this.state = {
      execution: null,
      metrics: {
        size: null,
        focus: null,
        translateX: 0,
        visiblePosition: []
      }
    };
  }

  render() {
    let {location, breadcrumb} = this.props;
    let {metrics, execution} = this.state;
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
              {execution.trace.slice(1).map((pos, idx) =>
                <ActionPanel
                  execution={execution}
                  position={pos}
                  key={pos.key}
                  active={metrics.visiblePosition.indexOf(pos.keyPath) > -1}
                  className={Style.item}
                  style={{zIndex: 1000}}
                  onReplace={this.scheduleCommand(this.replace, pos.keyPath)}
                  onCommand={this.scheduleCommand(this.executeActionCommand)}
                  onContext={this.scheduleCommand(this.onContext)}
                  onClose={idx > 0 ?
                    this.scheduleCommand(this.close, pos.keyPath) :
                    undefined}
                  onFocus={this.scheduleCommand(this.focus)}
                  />)}
              <ServicePanel
                key="service"
                active={metrics.visiblePosition.indexOf(ServicePanel.id) > -1}
                className={Style.item}
                onFocus={this.scheduleCommand(this.ensureIsInViewport)}
                style={{zIndex: 999}}
                execution={execution}
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
    let {metrics, execution} = this.state;
    return (
      <VBox className={Style.breadcrumb}>
        <WizardBreadcrumb
          execution={execution}
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
      let execution = ExecutionPath.fromPath(
        nextProps.location.pathname,
        nextProps.actions,
        nextProps.path,
        this.props.initialContext // initialContext can't be changed
      );
      let metrics = {...state.metrics, focus: execution.trace[1].keyPath};
      state = {...state, execution, metrics};
      if (this.props.DOMSize) {
        state = this.setSize(this.props.DOMSize)(state);
        state = this.ensureIsInViewport(state.execution.position.keyPath)(state);
      }
    }
    if (nextProps.DOMSize !== this.props.DOMSize) {
      if (this.props.DOMSize === null && nextProps.DOMSize) {
        state = this.setSize(nextProps.DOMSize)(state);
        state = this.ensureIsInViewport(state.execution.position.keyPath)(state);
      } else {
        state = this.setSize(nextProps.DOMSize)(state);
      }
    }
    return state;
  }

  _pushExecutionToPath(execution) {
    if (this.props.disableHistory) {
      return;
    }
    let path = ExecutionPath.toPath(execution);
    if (this._pushedPath !== path) {
      this._pushedPath = path;
      this.props.history.pushState(null, path);
    }
  }

  @autobind
  _onBreadcrumbClick(action) {
    let {execution, metrics} = this.state;
    let actions = execution.trace.map(pos => pos.keyPath);
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
  executeActionCommand(state, position, commandName, ...args) {
    // if position from which command originates differs from the current
    // execution position then close all further action panels.
    if (state.execution.position.keyPath !== position.keyPath) {
      let nextActionIdx = state.execution.indexOf(position.keyPath) + 1;
      let nextAction = state.execution.trace[nextActionIdx].keyPath;
      state = this.close(nextAction)(state);
    }
    let execution = Execution.executeCommandAtCurrentPosition(
        state.execution,
        commandName,
        ...args);
    state = {...state, execution};
    state = this.updateMetrics()(state);
    state = this.ensureIsInViewport(state.execution.position.keyPath)(state);
    this._pushExecutionToPath(execution);
    return state;
  }

  @Component.command
  onContext(state, position, context) {
    return this.executeActionCommand(position, ActionCommand.onContextCommand.name, context)(state);
  }

  @Component.command
  advanceTo(state, action, contextUpdate = {}) {
    let execution = Execution.advance(state.execution, action, contextUpdate);
    state = {...state, execution};
    state = this.updateMetrics()(state);
    state = this.ensureIsInViewport(state.execution.position.keyPath)(state);
    return state;
  }

  @Component.command
  replace(state, action, nextAction) {
    let idx = state.execution.indexOf(state.metrics.focus);
    let execution = Execution.replace(state.execution, action, nextAction);
    let newFocus = execution.trace[idx] ?
      execution.trace[idx].keyPath:
      execution.position.keyPath;
    state = {...state, execution};
    state = this.focus(newFocus)(state);
    state = this.ensureIsInViewport(nextAction)(state);
    this._pushExecutionToPath(state.execution);
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
    let panels = state.execution.trace.slice(1)
      .map(position => _computePanelMetrics(state.execution, position))
      .concat({action: ServicePanel.id, width: 150});
    let metrics = _computeCanvasMetrics(panels, focus, state.metrics.size);
    return {...state, metrics};
  }

  /**
   * Close panel with the given action.
   */
  @Component.command
  close(state, action) {
    let execution = Execution.close(state.execution, action);
    state = {...state, execution};
    state = this.focus(execution.position.keyPath)(state);
    return state;
  }

  /**
   * Ensure that given action is in the viewport.
   */
  @Component.command
  ensureIsInViewport(state, action) {
    let actions = state.execution.trace
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
    return state.metrics.visiblePosition.indexOf(keyPath) > -1;
  }

  /**
   * Move current focus of the wizard.
   */
  @Component.command
  moveFocus(state, delta) {
    let {execution, metrics} = state;
    let actions = execution.trace.map(pos => pos.keyPath);
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
    state = this.ensureIsInViewport(state.execution.position.keyPath)(state);
    return state;
  }

}

function _computePanelMetrics(execution, position) {
  var width = getWidth(position.element) || 300 // Panel.Style.self.minWidth;
  if (Execution.getAlternativeActions(execution, position).length > 0) {
    width = width + 150; // Panel.Style.sidebar.width
  }
  return {width, action: position.keyPath};
}

function _computeCanvasMetrics(panels, focus, size) {
  let widthToDistribute;
  let seenWidth = 0;
  let scrollToIdx;
  let translateX = 0;
  let visiblePosition = [];

  for (let i = 0; i < panels.length; i++) {
    let panel = panels[i];
    if (panel.action === focus) {
      scrollToIdx = i;
      widthToDistribute = size.width;
    }
    if (widthToDistribute !== undefined) {
      widthToDistribute = widthToDistribute - panel.width;
      if (widthToDistribute >= 0) {
        visiblePosition.push(panel.action);
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
    visiblePosition,
    size
  };
}
