/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @noflow
 */

import invariant from 'invariant';
import {quote} from '../StringUtils';
import {isEntity, getEntityType} from '../Entity';
import * as Instruction from './Instruction';
import * as Command from './Command';
import Node from './Node';
import type {Entity, PerActionState, Context} from '../types';

const INITIAL_CONTEXT = {
  USER: __REX_USER__ === null ? null : quote(__REX_USER__),
};

type ActionMap = {
  [id: string]: React$Element<*>,
};

type Domain = mixed;

/**
 * Graph state.
 */
export default class Graph {
  trace: Node[];
  actions: ActionMap;
  domain: Domain;

  /**
   * Start wizard.
   */
  static create(instruction, actions, initialContext, domain, tryAdvance = true) {
    initialContext = {...INITIAL_CONTEXT, ...initialContext};
    invariant(
      Instruction.Start.is(instruction),
      'Can only start wizard from a "Start" instruction',
    );
    let graph = new this([], actions, domain);
    let node = graph.createNode(instruction, initialContext);
    graph.trace.push(node);
    if (tryAdvance) {
      graph = graph.advance();
      invariant(
        !Instruction.Start.is(graph.node.instruction),
        'Invalid wizard config: cannot advance from start node',
      );
    }
    return graph;
  }

  constructor(trace: Node[], actions: ActionMap, domain: Domain) {
    this.trace = trace;
    this.actions = actions;
    this.domain = domain;
  }

  replaceTrace(trace: Node[]) {
    return new Graph(trace, this.actions);
  }

  createNode(
    instruction: Instruction.Instruction,
    context: Context = {},
    parent: ?Node = null,
    index: null | string | number = null,
    command: ?Function = null,
  ) {
    return Node.create(this, instruction, context, parent, index, command);
  }

  /**
   * The current node is the last node.
   */
  get node(): ?Node {
    return this.trace[this.trace.length - 1];
  }

  indexOf(action: string): number {
    for (let i = 0; i < this.trace.length; i++) {
      if (this.trace[i].keyPath === action) {
        return i;
      }
    }
    return -1;
  }

  _replaceCurrentNode(node: Node): Graph {
    let trace = this.trace.slice(0, this.trace.length - 1).concat(node);
    return new this.constructor(trace, this.actions, this.domain);
  }

  _appendAtCurrentNode(node: Node): Graph {
    let trace = this.trace.concat(node);
    return new this.constructor(trace, this.actions, this.domain);
  }

  _advanceToReference(reference: string, contextUpdate: ?Object = null): Graph {
    if (!Array.isArray(reference)) {
      reference = reference.split('/').filter(Boolean);
    }
    let graph = this;
    let firstNodeSeen = false;
    let wasContextUpdated = false;
    for (let i = 0; i < reference.length; i++) {
      let segment = reference[i];
      if (segment === '.') {
        continue;
      } else if (segment === '..') {
        graph = graph.close();
      } else {
        if (contextUpdate && !wasContextUpdated && firstNodeSeen) {
          wasContextUpdated = true;
          graph = graph.executeCommandAtCurrentNodeAndNoAdvance(
            Command.onContextCommand.name,
            contextUpdate,
          );
        }
        let nextNode = graph.node.then.filter(
          n =>
            n.action === segment ||
            (n.parent &&
              Instruction.IncludeWizard.is(n.parent.instruction) &&
              n.parent.action === segment),
        )[0];
        if (!nextNode) {
          return graph;
        }
        if (!nextNode.isAllowed) {
          return graph;
        }
        graph = graph._appendAtCurrentNode(nextNode);
        firstNodeSeen = true;
      }
    }
    return graph;
  }

  /**
   * Close ``action`` action .
   *
   * This also closes all actions which goes afterwards.
   */
  close(action: string = null): Graph {
    let idx;
    if (action === null) {
      idx = this.trace.length - 1;
    } else {
      idx = this.trace.findIndex(node => node.keyPath === action);
    }
    invariant(idx > -1, 'Invalid action keyPath: %s', action);
    let trace = this.trace.slice(0, idx);
    return new this.constructor(trace, this.actions, this.domain);
  }

  /**
   * Close all actions after the ``action`` action.
   */
  returnTo(action: string): Graph {
    let idx = this.indexOf(action);
    invariant(idx > -1, 'Invalid action keyPath: %s');
    if (idx < this.trace.length - 1) {
      let trace = this.trace.slice(0, idx + 1);
      return new this.constructor(trace, this.actions, this.domain);
    } else {
      return this;
    }
  }

  /**
   * Replace ``action`` action with ``nextAction`` action.
   */
  replace(action: string, nextAction: string, tryAdvance: boolean = true): Graph {
    let graph = this.close(action).advance(nextAction);
    if (tryAdvance) {
      graph = graph.advance();
    }
    return graph;
  }

  /**
   * Advance wizard given the ``action`` and a ``contextUpdate`` update to
   * context.
   */
  advance(action: ?string = null, contextUpdate: ?Context = null) {
    let graph = this;
    let currentNode = graph.node;

    if (contextUpdate !== null) {
      currentNode = currentNode.setContext(contextUpdate);
      graph = graph._replaceCurrentNode(currentNode);
    }

    let nextNodes = currentNode.then
      .filter(n => n.isAllowed)
      .filter(n => action === null || action === n.keyPath);

    if (nextNodes.length > 0) {
      let nextNode = nextNodes[0];
      if (Instruction.Execute.is(nextNode.instruction)) {
        graph = graph._appendAtCurrentNode(nextNode);
      } else if (Instruction.Replace.is(nextNode.instruction)) {
        graph = graph._advanceToReference(
          nextNode.instruction.replace,
          currentNode.context,
        );
        return graph;
      } else {
        invariant(
          false,
          'Only Execute and Replace are allowed as a valid node to advance',
        );
      }
    }

    return graph;
  }

  /**
   * Execute command at current node.
   */
  executeCommandAtCurrentNode(commandName: string, ...args: string[]): Graph {
    let node = this.node.executeCommand(commandName, ...args);
    let graph = this._replaceCurrentNode(node);
    return graph.advance();
  }

  executeCommandAtCurrentNodeAndNoAdvance(commandName: string, ...args: string[]): Graph {
    let currentNode = this.node.executeCommand(commandName, ...args);
    return this._replaceCurrentNode(currentNode);
  }

  setState(node: Node, stateUpdate: Object): Graph {
    let idx = this.trace.indexOf(node);
    let trace = this.trace.slice(0);
    trace[idx] = this.trace[idx].setState(stateUpdate);
    return new this.constructor(trace, this.actions, this.domain);
  }

  /**
   * Get a list of sibling actions for a ``node``.
   */
  siblingActions(node: Node = this.node): Node[] {
    invariant(!Instruction.Start.is(node.instruction), 'Invalid node passed');
    let prevNodeIdx = this.trace.indexOf(node) - 1;
    let prevNode = this.trace[prevNodeIdx];
    let nodes = prevNode.replaceContext(node.context).then.filter(n => n.isAllowed);
    return nodes;
  }

  /**
   * Get a list of next actions for a ``node``.
   */
  nextActions(node: Node = this.node): Node[] {
    invariant(!Instruction.Start.is(node.instruction), 'Invalid node passed');
    return node.then
      .filter(n => !Instruction.Replace.is(n.instruction))
      .filter(n => n.isAllowed);
  }

  /**
   * Perform an entity update.
   */
  updateEntity(prevEntity, nextEntity) {
    let graph = this.advance();
    let trace = graph.trace;
    let nextTrace = [];

    for (let i = 0; i < trace.length; i++) {
      let node = trace[i];
      let nextContext = updateEntityInContext(node.context, prevEntity, nextEntity);
      let nextNode = node.replaceContext(nextContext);
      if (!nextNode.isAllowed) {
        break;
      }
      if (nextNode.command != null) {
        let args;
        // special case for onContextCommand which require specifics for arg
        // processing
        if (nextNode.command.commandName === Command.onContextCommand.name) {
          args = nextNode.command.args.map(arg => // eslint-disable-line no-loop-func
            updateEntityInContext(arg, prevEntity, nextEntity));
        } else {
          args = nextNode.command.args.map(arg => // eslint-disable-line no-loop-func
            updateEntity(arg, prevEntity, nextEntity));
        }
        nextNode = nextNode.reExecuteCommand(...args);
      }
      nextTrace.push(nextNode);
    }
    return new this.constructor(nextTrace, this.actions, this.domain);
  }
}

/**
 * Produce a new context with the `prevEntity` replaced with the `nextEntity`.
 */
function updateEntityInContext(
  context: Context,
  prevEntity: Entity,
  nextEntity: Entity,
): Context {
  let nextContext = {};
  for (let key in context) {
    if (!context[key]) {
      continue;
    }
    let nextItem = updateEntity(context[key], prevEntity, nextEntity);
    if (nextItem != null) {
      nextContext[key] = nextItem;
    }
  }
  return nextContext;
}

function updateEntity(obj: mixed, prevEntity: Entity, nextEntity: Entity) {
  if (
    isEntity(obj) &&
    getEntityType(obj) === getEntityType(prevEntity) &&
    obj.id === prevEntity.id
  ) {
    return nextEntity;
  } else {
    return obj;
  }
}
