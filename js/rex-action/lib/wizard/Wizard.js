/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @noflow
 */

import emptyFunction from "empty/function";
import invariant from "invariant";
import * as React from "react";
import { VBox, HBox } from "react-stylesheet";

import { post } from "rex-widget/fetch";
import * as rexui from "rex-ui";

import createLogger from "debug";
import type { State, Entity, IStart, Position } from "../model/types";
import * as E from "../model/Entity";
import * as C from "../model/Command";
import * as S from "../model/State";
import * as P from "../model/Position";
import * as SP from "../model/StatePath";
import * as History from "rex-ui/History";
import { confirmNavigation } from "rex-ui/ConfirmNavigation";
import * as Environment from "../Environment";
import injectLocation from "../injectLocation";

import { type PreInstruction, parseInstruction } from "../parseInstruction";
import ActionContext from "../ActionContext";

import Breadcrumb from "./Breadcrumb";
import Sidebar from "./Sidebar";
import Toolbar from "./Toolbar";

type WizardProps = {
  data: Object,
  path: PreInstruction,
  domain: Object,
  actions: Object,
  initialContext: ?Object,
  settings: { includePageBreadcrumbItem?: boolean },
  pathPrefix: string,
  history: History.History,
  location: History.Location,
  locationAction: ?History.Action,
};

type WizardState = {
  graph: ?State
};

const log = createLogger("rex-action:wizard");

declare var __REX_USER__: ?string;

function getInitialContext(initialContext = {}) {
  initialContext = initialContext || {};
  initialContext = { ...initialContext };
  if (__REX_USER__ != null) {
    // eslint-disable-line no-undef
    initialContext.USER = `'${__REX_USER__}'`; // eslint-disable-line no-undef
  }
  return initialContext;
}

class Wizard extends React.Component<*, WizardProps, WizardState> {
  static defaultProps = {
    title: "Wizard",
    icon: "asterisk",
    renderTopSidebarItem: emptyFunction,
    settings: {},
    pathPrefix: ""
  };

  static renderTitle({ title }) {
    return title;
  }

  static getTitle(props) {
    return props.title;
  }

  _instruction: IStart;

  props: WizardProps;
  state: WizardState = { graph: null };

  constructor(props: WizardProps) {
    super(props);
    const { location, domain, path, actions, initialContext } = props;
    const instruction = parseInstruction(domain, actions, path);
    invariant(
      instruction.type === "start",
      'Wizard should start with "start" instruction but got: "%s"',
      instruction.type
    );
    this._instruction = instruction;
    log("use location", location);
    const graph = SP.fromPath(location.pathname, {
      instruction: this._instruction,
      context: getInitialContext(initialContext)
    });
    this._refetch(graph);
  }

  render() {
    const { graph } = this.state;
    log("render with state:", graph);
    if (graph == null) {
      return <rexui.PreloaderScreen />;
    }
    const { position } = graph;
    const nextPositions = S.next(graph).filter(P.isPositionAllowed);
    const siblingPositions = S.sibling(graph).filter(P.isPositionAllowed);
    invariant(position.type === "position", "Invalid state");
    const action = React.cloneElement(position.instruction.action.element, {
      key: position.instruction.action.id,
      context: position.context,
      actionState: position.state,
      setActionState: this._onState,
      onCommand: this._onCommand.bind(null, true),
      onContext: this._onContext,
      onContextNoAdvance: this._onContextNoAdvance,
      onEntityUpdate: this._onEntityUpdate,
      refetch: () =>
        this.setGraph(graph => {
          this._refetch(graph);
          return graph;
        }),
      toolbar: <Toolbar positions={nextPositions} onClick={this._onNext} />
    });
    let showBreadcrumb =
      this.props.settings.includePageBreadcrumbItem || position.prev != null;
    return (
      <VBox height="100%" flexGrow={1} flexDirection="column-reverse">
        <HBox flexBasis={0} flexGrow={1}>
          <div style={{ zIndex: 100, display: "flex" }}>
            <Sidebar
              positions={siblingPositions}
              currentPosition={graph.position}
              onClick={this._onReplaceWithSibling}
            />
          </div>
          <VBox flexGrow={1} flexShrink={1}>
            <ActionContext
              help={action.props.help}
              toolbar={
                <Toolbar positions={nextPositions} onClick={this._onNext} />
              }
            >
              {action}
            </ActionContext>
          </VBox>
        </HBox>
        {showBreadcrumb && (
          <div style={{ zIndex: 100 }}>
            <Breadcrumb
              height={50}
              includePageBreadcrumbItem={
                this.props.settings.includePageBreadcrumbItem
              }
              graph={graph}
              onClick={this._onReturn}
            />
          </div>
        )}
      </VBox>
    );
  }

  setGraph(update, confirmed?: boolean = false) {
    let updateState = state => {
      let prevGraph = state.graph;
      let graph = update(prevGraph);
      if (prevGraph != null && graph != null && prevGraph !== graph) {
        let path = SP.toPath(graph);
        if (path === SP.toPath(prevGraph)) {
          this.props.history.replace(this.props.pathPrefix + path);
        } else {
          this.props.history.push(this.props.pathPrefix + path);
        }
      }
      return { ...state, graph };
    };
    if (confirmed) {
      this.setStateConfirmed(updateState);
    } else {
      this.setState(updateState);
    }
  }

  setStateConfirmed = (
    updater: (WizardState & { graph: State }) => WizardState
  ) => {
    if (confirmNavigation()) {
      this.setState(state => {
        if (state.graph == null) {
          return state;
        } else {
          return updater(state);
        }
      });
    }
  };

  componentWillReceiveProps({ location, locationAction }: WizardProps) {
    if (location === this.props.location) {
      return;
    }

    this._onLocation(location, locationAction);
  }

  _refetch = (graph: ?State) => {
    if (graph == null) {
      return;
    }
    const data = {};
    S.forEachPosition(graph, pos => {
      data[pos.instruction.action.id] = {};
      Object.keys(pos.context).forEach(key => {
        const value = pos.context[key];
        if (E.isEntity(value)) {
          const entity: Entity = (value: any);
          data[pos.instruction.action.id][key] = {
            id: entity.id,
            type: E.getEntityType(entity)
          };
        } else {
          data[pos.instruction.action.id][key] = value;
        }
      });
    });
    post(this.props.data, null, JSON.stringify(data)).then(
      this._onRefetchComplete.bind(null, graph),
      this._onRefetchError
    );
  };

  _onRefetchComplete = (graph: State, data: Object) => {
    this.setGraph(_prevGraph => {
      return S.mapPosition(graph, pos => {
        const contextUpdate = data[pos.instruction.action.id];
        const nextContext = { ...pos.context, ...contextUpdate };
        const nextPos = { ...pos, context: nextContext };
        return P.isPositionAllowed(nextPos) ? nextPos : null;
      });
    });
  };

  _onRefetchError = (err: Error) => {
    // eslint-disable-next-line no-console
    console.error(err);
  };

  _onLocation = (
    location: History.Location,
    locationAction: History.Action,
  ) => {
    // TODO: maybe we should work with in-flight state instead?
    if (this.state.graph == null) {
      return;
    }
    let path = SP.toPath(this.state.graph);
    let pathname = location.pathname;

    if (Environment.isFirefox()) {
      pathname = decodeURIComponent(pathname);
    }

    pathname = normalizePathname(pathname, this.props.pathPrefix);

    if (path === pathname) {
      return;
    }

    let graph = SP.fromPath(pathname, {
      instruction: this._instruction,
      context: this.props.initialContext || {}
    });

    if (locationAction === "POP") {
      // try to transplant state
      try {
        invariant(this.state.graph != null, "Checked above");
        let prev = S.positions(this.state.graph);
        let next = S.positions(graph);

        for (let i = 0; i < next.length; i++) {
          let anext: Position = next[i];
          let aprev = prev[i];
          if (aprev == null) {
            break;
          }
          if (aprev.instruction.action.id !== anext.instruction.action.id) {
            break;
          }
          // $FlowFixMe: ...
          anext.state = { ...aprev.state, ...anext.state };
        }
      } catch (err) {
        console.error(err);
      }
    }

    this._refetch(graph);
  };

  _onNext = (actionId: string) => {
    this.setGraph(graph => S.advanceTo(graph, actionId), true);
  };

  _onReturn = (actionId: string) => {
    this.setGraph(graph => S.returnTo(graph, actionId), true);
  };

  _onReplaceWithSibling = (siblingActionId: string) => {
    this.setGraph(
      graph => S.replaceCurrentPositionWithSibling(graph, siblingActionId),
      true
    );
  };

  _onState = (stateUpdate: Object) => {
    this.setGraph(graph => S.setStateAtCurrentPosition(graph, stateUpdate));
  };

  _onCommand = (advance: boolean, commandName: string, ...args: any[]) => {
    this.setGraph(graph => {
      graph = S.applyCommandAtCurrentPosition(graph, commandName, args);
      if (advance) {
        graph = S.advanceToFirst(graph);
      }
      return graph;
    }, true);
  };

  _onContext = (context: Object) => {
    let commandName = C.onContextCommand.name;
    return this._onCommand(true, commandName, context);
  };

  _onContextNoAdvance = (context: Object) => {
    let commandName = C.onContextCommand.name;
    return this._onCommand(false, commandName, context);
  };

  _onEntityUpdate = (prevEntity: Entity, nextEntity: ?Entity) => {
    this.setGraph(graph => {
      graph = S.updateEntity(graph, prevEntity, nextEntity);
      this._refetch(graph);
      return graph;
    });
  };
}

function normalizePathname(pathname, prefix = "") {
  if (prefix && prefix === pathname.slice(0, prefix.length)) {
    pathname = pathname.slice(prefix.length);
  }
  return pathname;
}

export default injectLocation(Wizard);
