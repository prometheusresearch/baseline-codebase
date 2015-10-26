/**
 * @copyright 2015, Prometheus Research, LLC
 */

import invariant          from 'invariant';
import {quote}            from '../StringUtils';
import * as Entity        from '../Entity';
import * as Instruction   from './Instruction';
import Position           from './Position';

const INITIAL_CONTEXT = {
  USER: __REX_USER__ === null ?  null : quote(__REX_USER__)
};

/**
 * Execution state.
 */
export default class Execution {

  /**
   * Start wizard.
   */
  static create(instruction, initialContext, tryAdvance = true) {
    initialContext = {...INITIAL_CONTEXT, ...initialContext};
    invariant(
      Instruction.Start.is(instruction),
      'Can only start wizard from a "Start" instruction'
    );
    let execution = new this([]);
    let position = execution.createPosition(instruction);
    execution.trace.push(position);
    if (tryAdvance) {
      execution = execution.advance();
      invariant(
        !Instruction.Start.is(execution.position.instruction),
        'Invalid wizard config: cannot advance from start position'
      );
    }
    return execution;
  }

  constructor(trace) {
    this.trace = trace;
  }

  createPosition(instruction, context = {}, parent = null, index = null, command = null) {
    return Position.create(instruction, context, parent, index, command);
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

  /**
   * Close ``action`` action .
   *
   * This also closes all actions which goes afterwards.
   */
  close(action) {
    let positionIdx = this.trace.findIndex(position => position.keyPath === action);
    let trace = this.trace.slice(0, positionIdx);
    return new this.constructor(trace);
  }

  /**
   * Replace ``action`` action with ``nextAction`` action.
   */
  replace(action, nextAction, tryAdvance = true) {
    let execution = this.close(action).advance(nextAction);
    if (tryAdvance) {
      execution = execution.advance();
    }
    return execution;
  }

  /**
   * Advance wizard given the ``action`` and a ``contextUpdate`` update to
   * context.
   */
  advance(action = null, contextUpdate = {}) {
    let currentPosition = this.position.updateContext(contextUpdate);
    let trace = this.trace.slice(0, this.trace.length - 1);
    trace.push(currentPosition);

    let nextPositions = currentPosition
      .then
      .filter(pos => pos.isAllowed)
      .filter(pos => action === null || action === pos.keyPath);

    if (nextPositions.length > 0) {
      trace.push(nextPositions[0]);
    }

    return new this.constructor(trace);
  }

  /**
   * Execute command at current position.
   */
  executeCommandAtCurrentPosition(commandName, ...args) {
    let currentPosition = this.position;
    currentPosition = currentPosition.executeCommand(commandName, ...args);
    let trace = this.trace.slice(0, this.trace.length - 1);
    trace.push(currentPosition);

    let nextPositions = currentPosition
      .then
      .filter(pos => pos.isAllowed);

    if (nextPositions.length > 0) {
      trace.push(nextPositions[0]);
    }

    return new this.constructor(trace);
  }

  executeCommandAtCurrentPosition_(commandName, ...args) {
    let currentPosition = this.position;
    currentPosition = currentPosition.executeCommand(commandName, ...args);
    let trace = this.trace.slice(0, this.trace.length - 1);
    trace.push(currentPosition);
    return new this.constructor(trace);
  }

  returnToAction(action) {
    let idx = this.indexOf(action);
    invariant(
      idx > -1,
      ''
    );
    if (idx < this.trace.length - 1) {
      let trace = this.trace.slice(0, idx + 1);
      return new this.constructor(trace);
    } else {
      return this;
    }
  }

  /**
   * Get a list of alternative actions for a ``position``.
   */
  getAlternativeActions(position = this.position) {
    invariant(
      !Instruction.Start.is(position.instruction),
      'Invalid position passed'
    );
    let prevPositionIdx = this.trace.indexOf(position) - 1;
    let prevPosition = this.trace[prevPositionIdx];
    let positions = prevPosition.withContext(position.context).then.filter(pos => pos.isAllowed);
    return positions;
  }


  /**
   * Get a list of next actions for a ``position``.
   */
  getNextActions(position = this.position) {
    invariant(
      !Instruction.Start.is(position.instruction),
      'Invalid position passed'
    );
    return position.then.filter(pos => pos.isAllowed);
  }

  /**
   * Perform an entity update.
   */
  updateEntity(prevEntity, nextEntity) {
    let nextTrace = [];

    for (let i = 0; i < this.trace.length; i++) {
      let position = this.trace[i];
      let nextContext = updateEntityInContext(
        position.context,
        prevEntity,
        nextEntity
      );
      let nextPosition = position.withContext(nextContext);
      if (!nextPosition.isAllowed) {
        break;
      }
      if (nextPosition.command !== null) {
        let args = nextPosition.command.args.map(arg => // eslint-disable-line no-loop-func
          updateEntity(arg, prevEntity, nextEntity));
        nextPosition = nextPosition.reexecuteCurrentCommand(...args);
      }
      nextTrace.push(nextPosition);
    }
    let nextExecution = new this.constructor(nextTrace);
    nextExecution = nextExecution.advance();
    return nextExecution;
  }

}

/**
 * Produce a new context with the `prevEntity` replaced with the `nextEntity`.
 */
function updateEntityInContext(context, prevEntity, nextEntity) {
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

function updateEntity(obj, prevEntity, nextEntity) {
  if (
    Entity.isEntity(obj) &&
    Entity.getEntityType(obj) === Entity.getEntityType(prevEntity) &&
    obj.id === prevEntity.id
  ) {
    return nextEntity;
  } else {
    return obj;
  }
}
