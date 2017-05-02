/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';
import type {RecordType} from '../Typing';
import {type Command, onContextCommand} from './Command';

/**
 * Abstract instruction.
 */
export type Instruction = IInclude | IExecute | IReplace | IRepeat;

/**
 * Instruction which can contain other instructions.
 */
export type ContainerInstruction = IInclude | IRepeat;

/**
 * Execute an action (render a piece of UI to a user).
 */
export type IExecute = {
  type: 'execute',
  action: ActionSpec,
  then: Instruction[],
};

export type ActionSpec = {
  id: string,
  name?: string,
  title?: string,
  domain: Domain,
  element: React$Element<*>,
  commands: {
    [commandName: string]: Command,
  },
  contextTypes: {
    input: RecordType,
    output: RecordType,
  },
};

/**
 * Include another set of instructions.
 */
export type IInclude = {
  type: 'include',
  include: Instruction[],
  then: Instruction[],
};

/**
 * Repeat a set of instructions.
 */
export type IRepeat = {
  type: 'repeat',
  repeat: Instruction[],
  then: Instruction[],
};

/**
 * Replace the with the reference and the context update.
 */
export type IReplace = {
  type: 'replace',
  traverseBack: number,
  traverse: Array<{
    actionId: string,
    contextUpdate: Context,
  }>,
};

export type Context = {
  [key: string]: ContextValue,
};

// This is actually $key but we won't encode it in type system
type ContextKey = string;

type ContextValue = string | number | boolean;

type ContextUpdateSpec = {
  [key: string]: ContextValue | ContextKey,
};

export type Config = {
  context: Context,
  instruction: Instruction[],
};

export type Domain = {
  [entityName: string]: {
    [stateName: string]: {
      expression: Function,
    },
  },
};

export type ActionState = {
  [name: string]: string,
};

export type Position = {
  context: Context,
  state: ActionState,
  command?: {commandName: string, args: string[]},

  instruction: IExecute,
  stack: ContainerInstruction[],
  trace: Position[],
};

export type State = {
  position: ?Position,
  config: Config,
};

export function create(config: Config): State {
  return {
    position: null,
    config,
  };
}

function next(state: State): Position[] {
  if (state.position != null) {
    return nextPosition(state.position);
  } else {
    const context = state.config.context || {};
    const possibelStartPositions = [];
    collectFromTraverse(
      possibelStartPositions,
      [],
      [],
      context,
      state.config.instruction,
    );
    return possibelStartPositions;
  }
}

export function close(state: State, _actionId: string): State {
  // TODO: implement
  return state;
}

export function returnTo(state: State, actionId: string): State {
  const currentPos = state.position;
  invariant(currentPos != null, 'Invalid state');
  const nextPos = currentPos.trace.find(pos => pos.instruction.action.id === actionId);
  invariant(nextPos != null, 'Cannot return to %s: no such action in trace', actionId);
  return {...state, position: nextPos};
}

export function advanceTo(
  state: State,
  actionId: string,
  contextUpdate: ?Context,
): State {
  const nextPos = next(state)
    .map(pos => updatePositionContext(pos, contextUpdate))
    .filter(isPositionAllowed)
    .find(pos => pos.instruction.action.id === actionId);
  invariant(nextPos != null, 'Unable to advance wizard to position: %s', actionId);
  return {...state, position: nextPos};
}

export function advanceToFirst(state: State, contextUpdate?: Context): State {
  const nextPosList = next(state).map(pos => updatePositionContext(pos, contextUpdate));
  const nextPosListAllowed = nextPosList.filter(isPositionAllowed);
  invariant(nextPosListAllowed.length > 0, 'Unable to advance wizard');
  const nextPos = nextPosListAllowed[0];
  return {...state, position: nextPos};
}

export function replaceCurrentPositionWithSibling(state: State, actionId: string): State {
  const currentPos = state.position;
  invariant(currentPos != null, 'Invalid state');
  if (currentPos.trace.length === 0) {
    return state;
  }
  const prevPos = currentPos.trace[currentPos.trace.length - 1];
  const nextState = {...state, position: prevPos};
  return advanceTo(nextState, actionId);
}

export function setStateAtCurrentPosition(state: State, stateUpdate: Object): State {
  invariant(state.position != null, 'Invalid state');
  const nextPosition = {
    ...state.position,
    state: {...state.position.state, ...stateUpdate},
  };
  return {...state, position: nextPosition};
}

export function applyCommandAtCurrentPosition(
  state: State,
  commandName: string,
  args: Array<string>,
): State {
  invariant(state.position != null, 'Invalid state');
  const {instruction: {action}, context} = state.position;
  const command = getActionCommand(action, commandName);
  invariant(command != null, 'Unable to locate command: %s', commandName);
  const nextContext = command.execute(action.element.props, context, ...args);
  const nextPosition = {
    ...state.position,
    context: nextContext,
    command: {commandName, args},
  };
  return {...state, position: nextPosition};
}

export function getActionCommand(action: ActionSpec, commandName: string): ?Command {
  if (commandName === onContextCommand.name) {
    return onContextCommand;
  }
  return action.commands ? action.commands[commandName] : null;
}

/**
 * Check if the position is allowed.
 */
export function isPositionAllowed(pos: Position): boolean {
  const {contextTypes, domain} = pos.instruction.action;
  return contextTypes.input.match(pos.context, domain);
}

function updatePositionContext(pos: Position, contextUpdate: ?Context): Position {
  if (contextUpdate == null) {
    return pos;
  }
  return {...pos, context: {...pos.context, ...contextUpdate}};
}

/**
 * Produce a list of possible next positions.
 */
export function nextPosition(pos: Position): Position[] {
  const result = [];
  const nextTrace = pos.trace.concat(pos);
  if (pos.instruction.then.length > 0) {
    collectFromTraverse(result, nextTrace, pos.stack, pos.context, pos.instruction.then);
  } else if (pos.stack.length > 0) {
    collectFromStack(result, nextTrace, pos.stack, pos.context);
  }
  return result;
}

/**
 * Produce a list of possible sibling positions.
 */
export function siblingPosition(pos: Position): Position[] {
  if (pos.trace.length === 0) {
    return [];
  }
  const prev = pos.trace[pos.trace.length - 1];
  return nextPosition(prev);
}

function collectFromStack(
  to: Position[],
  trace: Position[],
  stack: ContainerInstruction[],
  context: Context,
) {
  const nextStack = stack.slice(0);
  while (nextStack.length > 0) {
    const parent = nextStack.pop();
    if (parent.type === 'include') {
      if (parent.then.length > 0) {
        collectFromTraverse(to, trace, nextStack, context, parent.then);
        break;
      }
    } else if (parent.type === 'repeat') {
      collectFromTraverse(to, trace, nextStack.concat(parent), context, parent.repeat);
      collectFromTraverse(to, trace, nextStack, context, parent.then);
      break;
    } else {
      invariant(false, 'Unable to process: %s', parent.type);
    }
  }
}

function collectFromTraverse(
  to: Position[],
  trace: Position[],
  stack: ContainerInstruction[],
  context: Context,
  instructionList: Instruction[],
) {
  for (let i = 0; i < instructionList.length; i++) {
    const instruction = instructionList[i];
    if (instruction.type === 'execute') {
      to.push({instruction, stack, trace, context, state: {}});
    } else if (instruction.type === 'include') {
      collectFromTraverse(
        to,
        trace,
        stack.concat(instruction),
        context,
        instruction.include,
      );
    } else if (instruction.type === 'repeat') {
      collectFromTraverse(
        to,
        trace,
        stack.concat(instruction),
        context,
        instruction.repeat,
      );
    } else if (instruction.type === 'replace') {
      // traverse back
      const nextTrace = trace.slice(0, trace.length - instruction.traverseBack);
      let pos = nextTrace.pop();
      invariant(pos != null, 'Unable to process replace');
      // traverse forward
      for (let i = 0; i < instruction.traverse.length; i++) {
        const {actionId, contextUpdate} = instruction.traverse[i];
        pos = nextPosition(pos).find(pos => pos.instruction.action.id === actionId);
        invariant(pos != null, 'Unable to process replace');
        // TODO: we need to refer to original context here
        pos = {...pos, context: updateContextBySpec(pos.context, context, contextUpdate)};
      }
      collectFromTraverse(to, pos.trace, pos.stack, pos.context, [pos.instruction]);
    } else {
      invariant(false, 'Unable to process: %s', instruction.type);
    }
  }
}

function updateContextBySpec(
  context: Context,
  originalContext: Context,
  updateSpec: ContextUpdateSpec,
): Context {
  const nextContext = {...context};
  for (const key in updateSpec) {
    const value = updateSpec[key];
    if (typeof value === 'string' && value.startsWith('$')) {
      nextContext[key] = originalContext[value.slice(1)];
    } else {
      nextContext[key] = value;
    }
  }
  return nextContext;
}
