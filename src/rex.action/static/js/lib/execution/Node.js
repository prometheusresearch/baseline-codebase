/**
 * @copyright 2015, Prometheus Research, LLC
 */

import memoize            from 'memoize-decorator';
import invariant          from 'invariant';
import flatten            from 'lodash/array/flatten';
import * as Entity        from '../Entity';
import * as Command       from './Command';
import {Start, Execute, IncludeWizard, Repeat, Replace} from './Instruction';

/**
 * Objects of this class represent a node within a wizard execution state.
 */
export default class Node {

  static create(instruction, context = {}, parent = null, index = null, prev = null) {
    return new this(instruction, context, {}, parent, index, null, prev);
  }

  constructor(
    instruction,
    context = {},
    state = {},
    parent = null,
    index = null,
    command = null,
    prev = null,
  ) {
    this.instruction = instruction;
    this.context = context;
    this.state = state;
    this.parent = parent;
    this.index = index;
    this.command = command;
    this.prev = prev;
  }

  /**
   * Update context.
   */
  setContext(contextUpdate) {
    let context = {...this.context, ...contextUpdate};
    return this.replaceContext(context);
  }

  /**
   * Replace context.
   */
  replaceContext(context) {
    if (Start.is(this.instruction)) {
      return this;
    }
    return new this.constructor(
      this.instruction,
      context,
      this.state,
      this.parent,
      this.index,
      this.command,
      this.prev,
    );
  }

  @memoize
  get _concreteNode() {
    if (
      Start.is(this.instruction) ||
      IncludeWizard.is(this.instruction) ||
      Execute.is(this.instruction) ||
      Repeat.is(this.instruction)
    ) {
      return this;
    } else if (Replace.is(this.instruction)) {
      let node = resolveNodeByReference(this, this.instruction.replace);
      return node;
    } else {
      invariant(false, 'Node is not concrete');
    }
  }

  get _isConcreteNode() {
    return this === this._concreteNode;
  }

  /**
   * Update state.
   */
  setState(stateUpdate) {
    let state = {...this.state, ...stateUpdate};
    return this.replaceState(state);
  }

  /**
   * Replace state.
   */
  replaceState(state) {
    return new this.constructor(
      this.instruction,
      this.context,
      state,
      this.parent,
      this.index,
      this.command,
      this.prev,
    );
  }

  /**
   * Execute command.
   */
  executeCommand(commandName, ...args) {
    let command = Command.getCommand(this.element, commandName);
    let context = command.execute(this.element.props, this.context, ...args);
    return new this.constructor(
      this.instruction,
      context,
      this.state,
      this.parent,
      this.index,
      {commandName, args},
      this.prev,
    );
  }

  /**
   * Re execute current command.
   */
  reExecuteCommand(...args) {
    if (this.command) {
      return this.executeCommand(this.command.commandName, ...args);
    } else {
      return this;
    }
  }

  /**
   * Start node.
   *
   * Points to a node for Start instruction for the nearest wizard.
   */
  @memoize
  get start() {
    let start = this;
    while (start.prev) {
      start = start.prev;
    }
    return start;
  }

  /**
   * React element which should be used to render.
   */
  @memoize
  get element() {
    if (this._isConcreteNode) {
      return this.instruction.element;
    } else {
      return this._concreteNode.element;
    }
  }

  /**
   * Key path.
   */
  @memoize
  get keyPath() {
    let keyPath = [];
    if (this.action !== null) {
      keyPath.push(this.action);
    }
    if (this.index !== null) {
      keyPath.push(this.index);
    }
    if (this.parent) {
      return `${this.parent.keyPath}.${keyPath.join('.')}`;
    } else {
      return keyPath.join('.');
    }
  }

  /**
   * Key.
   */
  @memoize
  get key() {
    return Object
      .keys(this.contextTypes.input.rows)
      .map(k => this.context[k])
      .map(v => Entity.isEntity(v) ? v.id : v)
      .join('__') + '__' + this.action + '__' + this.index;
  }

  /**
   * List of next nodes.
   */
  @memoize
  get then() {
    return this._thenWithContext(this.context);
  }

  /**
   * Action ID.
   */
  @memoize
  get action() {
    if (this._isConcreteNode) {
      return this.instruction.action;
    } else {
      return this._concreteNode.action;
    }
  }

  /**
   * Context types.
   */
  @memoize
  get contextTypes() {
    return this.element.props.contextTypes;
  }

  /**
   * Check if node is allowed.
   */
  @memoize
  get isAllowed() {
    let node = this._concreteNode;
    if (Start.is(node.instruction)) {
      return true;
    } else {
      return node.contextTypes.input.match(this.context);
    }
  }

  _thenWithContext(context) {
    // Handle case where we are "exiting" from the current node.
    // This might be the case for wizard inclusion or repeat group.
    if (this.instruction.then.length === 0 && this.parent) {
      if (Repeat.is(this.parent.instruction)) {
        let thenExit = this.parent._thenWithContext(context);
        let thenLoop = this.parent.instruction.repeat.map(inst =>
          this.constructor.create(
            inst,
            context,
            this.parent,
            this.index + 1,
            this,
          ));
        return thenLoop.concat(thenExit);
      } else if (IncludeWizard.is(this.parent.instruction)) {
        let thenExit = this.parent._thenWithContext(context);
        return thenExit;
      } else {
        invariant(
          false,
          'found unknown instruction'
        );
      }
    } else {
      let nodes = [];

      for (let i = 0; i < this.instruction.then.length; i++) {
        let node = this.constructor.create(
          this.instruction.then[i],
          context,
          this.parent,
          this.index,
          this,
        );
        nodes = nodes.concat(realizeNode(node));
      }
      return nodes;
    }
  }

}

/**
 * Realize node into an array of realized nodes.
 */
function realizeNode(node) {
  if (Execute.is(node.instruction) || Replace.is(node.instruction)) {
    return [node];
  } else if (IncludeWizard.is(node.instruction)) {
    // TODO: handle type refinements on wizard level, we are not using them
    // right now
    let startNode = Node.create(
      node.element.props.path,
      node.context,
      node,
      node.action,
    );
    return flatten(startNode.then.map(realizeNode));
  } else if (Repeat.is(node.instruction)) {
    return flatten(node.instruction.repeat.map(n =>
      realizeNode(Node.create(n, node.context, node, 0))));
  } else {
    invariant(
      false,
      'Unknown instruction found: %s', node.instruction.constructor.name
    );
  }
}

function resolveNodeByReference(node, reference) {
  let currentNode = node;
  let context = node.context;
  if (reference[0] === '/') {
    currentNode = currentNode.start;
    reference = reference.slice(1);
  } else {
    currentNode = currentNode.prev;
  }
  let segments = reference.split('/');
  for (let i = 0; i < segments.length; i++) {
    let segment = segments[i];
    if (segment === '.') {
      // do nothing
    } else if (segment === '..') {
      currentNode = currentNode.prev;
    } else {
      let nextNodes = currentNode.then;
      // TODO: Allow to traverse replace actions, now we filter them out not to
      // fail into infinte recursion.
      nextNodes = nextNodes.filter(n => !Replace.is(n.instruction));
      // TODO: Fail on crossing wizard boundaries.
      nextNodes = nextNodes.filter(n =>
        (n.action === segment) ||
        (n.parent &&
         IncludeWizard.is(n.parent.instruction) &&
         n.parent.action === segment)
      );
      currentNode = nextNodes[0];
    }
    invariant(
      currentNode != null,
      'Invalid action reference: %s', reference
    );
  }
  context = {...currentNode.context, ...context};
  context = maskContext(context, currentNode.contextTypes);
  return currentNode.replaceContext(context);
}

/**
 * Mask context by only allowing keys which either allowed in input or output
 * context types.
 */
function maskContext(context, {input, output}) {
  let maskedContext = {};
  for (let key in context) {
    if (!context.hasOwnProperty(key)) {
      continue;
    }
    if (!(input.rows[key] || output.rows[key])) {
      continue;
    }
    maskedContext[key] = context[key];
  }
  return maskedContext;
}
