/**
 * @copyright 2015, Prometheus Research, LLC
 */

import memoize            from 'memoize-decorator';
import invariant          from 'invariant';
import * as Instruction   from './Instruction';
import * as ActionCommand from './ActionCommand';
import * as Entity        from './Entity';

export const DEFAULT_INITIAL_CONTEXT = {
  USER: __REX_USER__ === null ? null : "'" + __REX_USER__ + "'"
};

/**
 * Objects of this type represent the position within the wizard.
 */
export class Position {

  constructor(actions, context, instruction, parent, index = null, command = null) { // eslint-disable-line max-params,max-len
    this.actions = actions;
    this.context = context;
    this.instruction = instruction;
    this.parent = parent;
    this.index = index;
    this.command = command;
  }

  updateContext(contextUpdate) {
    return this.withContext({...this.context, ...contextUpdate});
  }

  withContext(context) {
    return new Position(
      this.actions,
      context,
      this.instruction,
      this.parent,
      this.index,
      this.command
    );
  }

  thenWithContext(context) {
    if (this.parent && this.instruction.then.length === 0) {
      let thenExit = this.parent.thenWithContext(context);
      let thenLoop = [
        Position.fromInstruction(
          this.actions,
          context,
          this.parent.instruction.repeat,
          this.parent,
          this.index + 1
        )
      ];
      return thenLoop.concat(thenExit);
    } else {
      return this.instruction.then.map(inst =>
        Position.fromInstruction(
          this.actions,
          context,
          inst,
          this.parent,
          this.index
        ));
    }
  }

  executeCommand(commandName, ...args) {
    let command = ActionCommand.getCommand(this.element, commandName);
    let context = command.execute(this.element.props, this.context, ...args);
    return new Position(
      this.actions,
      context,
      this.instruction,
      this.parent,
      this.index,
      {commandName, args}
    );
  }

  @memoize
  get element() {
    return this.actions[this.action];
  }

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

  @memoize
  get key() {
    return Object
      .keys(this.contextTypes.input.rows)
      .map(k => this.context[k])
      .map(v => Entity.isEntity(v) ? v.id : v)
      .join('__') + '__' + this.action + '__' + this.index;
  }

  @memoize
  get then() {
    return this.thenWithContext(this.context);
  }

  @memoize
  get action() {
    if (this.instruction instanceof Instruction.Execute) {
      return this.instruction.action;
    } else {
      return null;
    }
  }

  @memoize
  get contextTypes() {
    return this.element.props.contextTypes;
  }

  @memoize
  get isAllowed() {
    return this.contextTypes.input.match(this.context);
  }

  static fromInstruction(actions, context, instruction, parent, index = null) {
    while (Instruction.Repeat.is(instruction)) {
      parent = new Position(actions, context, instruction, parent, index);
      index = 0;
      instruction = instruction.repeat;
    }
    return new Position(actions, context, instruction, parent, index);
  }
}

/**
 * Wizard execution state.
 */
export class Execution {

  constructor(actions, trace) {
    this.actions = actions;
    this.trace = trace;
  }

  /**
   * The current position is the last position.
   */
  get position() {
    return this.trace[this.trace.length - 1];
  }

  indexOf(action) {
    for (let i = 0; i < this.trace.length; i++) {
      if (this.trace[i].keyPath === action) {
        return i;
      }
    }
    return -1;
  }
}

function setTrace(execution, trace) {
  execution = new Execution(execution.actions, trace);
  return execution;
}

/**
 * Start wizard.
 */
export function start(actions, instruction, initialContext) {
  initialContext = {...DEFAULT_INITIAL_CONTEXT, ...initialContext};
  invariant(
    Instruction.Start.is(instruction),
    'Can only start wizard from a "Start" instruction'
  )
  let position = new Position(actions, {}, instruction, null, null);
  let execution = new Execution(actions, [position]);
  execution = advance(execution, null, initialContext);
  invariant(
    !Instruction.Start.is(execution.position.instruction),
    'Invalid wizard config: cannot advance from start position'
  )
  return execution;
}

/**
 * Advance wizard given the ``action`` and a ``contextUpdate`` update to
 * context.
 */
export function advance(execution, action = null, contextUpdate = {}) {
  let currentPosition = execution.position.updateContext(contextUpdate);
  let trace = execution.trace.slice(0, execution.trace.length - 1);
  trace.push(currentPosition);

  let nextPositions = currentPosition
    .then
    .filter(pos => pos.isAllowed)
    .filter(pos => action === null || action === pos.keyPath);

  if (nextPositions.length > 0) {
    trace.push(nextPositions[0]);
  }

  return new Execution(execution.actions, trace);
}

/**
 * Execute command at current position.
 */
export function executeCommandAtCurrentPosition(execution, commandName, ...args) {
  let currentPosition = execution.position;
  currentPosition = currentPosition.executeCommand(commandName, ...args);
  let trace = execution.trace.slice(0, execution.trace.length - 1);
  trace.push(currentPosition);

  let nextPositions = currentPosition
    .then
    .filter(pos => pos.isAllowed);

  if (nextPositions.length > 0) {
    trace.push(nextPositions[0]);
  }

  return new Execution(execution.actions, trace);
}

export function returnToAction(execution, action) {
  let idx = execution.indexOf(action);
  invariant(
    idx > -1,
    ''
  );
  if (idx < execution.trace.length - 1) {
    let trace = execution.trace.slice(0, idx + 1);
    return new Execution(execution.actions, trace);
  } else {
    return execution;
  }
}

export function executeCommandAtCurrentPosition_(execution, commandName, ...args) {
  let currentPosition = execution.position;
  currentPosition = currentPosition.executeCommand(commandName, ...args);
  let trace = execution.trace.slice(0, execution.trace.length - 1);
  trace.push(currentPosition);
  return new Execution(execution.actions, trace);
}

/**
 * Close ``action`` action .
 *
 * This also closes all actions which goes afterwards.
 */
export function close(execution, action) {
  let positionIdx = execution.trace.findIndex(position => position.keyPath === action);
  let trace = execution.trace.slice(0, positionIdx);
  execution = setTrace(execution, trace);
  return execution;
}

/**
 * Replace ``action`` action with ``nextAction`` action.
 */
export function replace(execution, action, nextAction, tryAdvance = true) {
  execution = close(execution, action);
  execution = advance(execution, nextAction);
  if (tryAdvance) {
    execution = advance(execution, null);
  }
  return execution;
}

/**
 * Get a list of alternative actions for a ``position``.
 */
export function getAlternativeActions(execution, position = execution.position) {
  invariant(
    !Instruction.Start.is(position.instruction),
    'Invalid position passed'
  )
  let prevPositionIdx = execution.trace.indexOf(position) - 1;
  let prevPosition = execution.trace[prevPositionIdx];
  return prevPosition.withContext(position.context).then.filter(pos => pos.isAllowed);
}

/**
 * Get a list of next actions for a ``position``.
 */
export function getNextActions(execution, position = execution.position) {
  invariant(
    !Instruction.Start.is(position.instruction),
    'Invalid position passed'
  );
  return position.then.filter(pos => pos.isAllowed);
}
