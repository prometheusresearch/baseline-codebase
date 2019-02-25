/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';

import type {
  Position,
  StartPosition,
  Context,
  ContextUpdateSpec,
  ContainerInstruction,
  Instruction,
  Command,
  RecordType,
  Domain,
} from './types';
import {onContextCommand} from './Command';

type NextPositionOptions = {skipReplace?: boolean};

/**
 * Produce a list of possible next positions.
 */
export function nextPosition(
  pos: StartPosition | Position,
  options?: NextPositionOptions = {},
): Position[] {
  const result = [];
  if (pos.type === 'start-position') {
    collectFromTraverse(result, pos, [], pos.context, pos.instruction.then, options);
  } else if (pos.type === 'position') {
    if (pos.instruction.then.length > 0) {
      collectFromTraverse(
        result,
        pos,
        pos.stack,
        pos.context,
        pos.instruction.then,
        options,
      );
    } else if (pos.stack.length > 0) {
      collectFromStack(result, pos, pos.stack, pos.context, options);
    }
  } else {
    invariant(false, 'Invalid position: %s', JSON.stringify(pos));
  }
  return result;
}

export function findPosition(pos: Position, find: (Position) => boolean): ?Position {
  let cur = pos;
  while (cur.type === 'position') {
    if (find(cur)) {
      return cur;
    }
    cur = cur.prev;
  }
  return null;
}

/**
 * Check if the position is allowed.
 */
export function isPositionAllowed(pos: Position): boolean {
  const {contextTypes, domain} = pos.instruction.action;
  return contextTypes.input.match(pos.context, domain);
}

export function updatePositionContext(pos: Position, contextUpdate: ?Context): Position {
  if (contextUpdate == null) {
    return pos;
  }
  return {...pos, context: {...pos.context, ...contextUpdate}};
}

export function applyCommandAtPosition(
  position: Position,
  commandName: string,
  args: Array<any>,
): Position {
  const {instruction: {action}, context} = position;
  const command = getCommandForPosition(position, commandName);
  invariant(command != null, 'Unable to locate command: %s', commandName);
  const parsedArgs = command.parseArguments(action.element.props, args);
  const nextContext = command.execute(action.element.props, context, parsedArgs);
  const nextPosition = {
    ...position,
    context: nextContext,
    command: {commandName, args: parsedArgs},
  };
  return nextPosition;
}

export function getCommandForPosition(position: Position, commandName: string): ?Command {
  const {instruction: {action}} = position;
  if (commandName === onContextCommand.name) {
    return onContextCommand;
  }
  return action.commands ? action.commands[commandName] : null;
}

function collectFromStack(
  to: Position[],
  currentPos: StartPosition | Position,
  stack: ContainerInstruction[],
  context: Context,
  options: NextPositionOptions,
) {
  const nextStack = stack.slice(0);
  while (nextStack.length > 0) {
    const parent = nextStack.pop();
    if (parent.type === 'include') {
      if (parent.then.length > 0) {
        collectFromTraverse(to, currentPos, nextStack, context, parent.then, options);
        break;
      }
    } else if (parent.type === 'repeat') {
      collectFromTraverse(
        to,
        currentPos,
        nextStack.concat(parent),
        context,
        parent.repeat,
        options,
      );
      collectFromTraverse(to, currentPos, nextStack, context, parent.then, options);
      break;
    } else {
      invariant(false, 'Unable to process: %s', parent.type);
    }
  }
}

export function collectFromTraverse(
  to: Position[],
  currentPos: StartPosition | Position,
  stack: ContainerInstruction[],
  context: Context,
  instructionList: Instruction[],
  options: NextPositionOptions,
) {
  for (let i = 0; i < instructionList.length; i++) {
    const instruction = instructionList[i];
    if (instruction.type === 'execute') {
      to.push({
        type: 'position',
        instruction,
        stack,
        prev: currentPos,
        context,
        state: {},
      });
    } else if (instruction.type === 'include') {
      collectFromTraverse(
        to,
        currentPos,
        stack.concat(instruction),
        context,
        instruction.include.then,
        options,
      );
    } else if (instruction.type === 'repeat') {
      collectFromTraverse(
        to,
        currentPos,
        stack.concat(instruction),
        context,
        instruction.repeat,
        options,
      );
    } else if (instruction.type === 'replace') {
      if (options.skipReplace) {
        continue;
      }

      // traverse back
      let referencedInstruction = instruction;
      let traverseBack = instruction.traverseBack;
      while (traverseBack >= 0) {
        referencedInstruction = referencedInstruction.parent;
        invariant(
          referencedInstruction != null,
          'Unable to process replace (back traverse)',
        );
        traverseBack -= 1;
      }

      let referencedPosition = currentPos;
      for (const pos of traceWithNoStart(currentPos)) {
        if (referencedInstruction.type === 'execute') {
          if (pos.instruction === referencedInstruction) {
            referencedPosition = pos;
            break;
          }
        } else if (referencedInstruction.type === 'include') {
          if (pos.stack.some(i => i === referencedInstruction)) {
            referencedPosition = pos.prev;
            break;
          }
        } else if (referencedInstruction.type === 'start') {
          if (referencedInstruction.parent == null) {
            referencedPosition = pos.prev;
            break;
          } else {
            // $FlowFixMe:
            if (pos.stack.some(i => i === referencedInstruction.parent)) {
              referencedPosition = pos.prev;
              break;
            }
          }
        } else {
          invariant(
            'Invalid instruction referenced (traverse back): "%s"',
            referencedInstruction.type,
          );
        }
      }

      // traverse forward
      for (let i = 0; i < instruction.traverse.length; i++) {
        const {actionName, contextUpdate} = instruction.traverse[i];
        invariant(
          referencedInstruction != null,
          'Unable to process replace (forward traverse)',
        );
        // $FlowFixMe:
        referencedInstruction = referencedInstruction.then.find(
          instruction =>
            (instruction.type === 'execute' && instruction.action.name === actionName) ||
            (instruction.type === 'include' && instruction.name === actionName),
        );
        invariant(
          referencedInstruction != null,
          'Unable to process replace: forward traverse to "%s"',
          actionName,
        );
        // $FlowFixMe: not sure what's wrong...
        for (const nextPos of nextPosition(referencedPosition, {skipReplace: true})) {
          if (referencedInstruction.type === 'execute') {
            if (isProvidedBy(nextPos, referencedInstruction)) {
              const contextUpdateArg = updateContextBySpec(
                nextPos.instruction.action.domain,
                nextPos.instruction.action.contextTypes,
                referencedPosition.context,
                context,
                contextUpdate,
              );
              if (!isEmptyObject(contextUpdateArg)) {
                referencedPosition = applyCommandAtPosition(nextPos, 'context', [
                  contextUpdateArg,
                ]);
              } else {
                referencedPosition = nextPos;
              }
              if (i === instruction.traverse.length - 1) {
                referencedPosition = {...referencedPosition, from: 'replace'};
                to.push(referencedPosition);
              }
              break;
            }
          } else if (referencedInstruction.type === 'include') {
            invariant(
              i === instruction.traverse.length - 1,
              'Trying to replace past the inclided wizard which is not supported',
            );
            if (isProvidedBy(nextPos, referencedInstruction)) {
              const contextUpdateArg = updateContextBySpec(
                nextPos.instruction.action.domain,
                nextPos.instruction.action.contextTypes,
                referencedPosition.context,
                context,
                contextUpdate,
              );
              if (!isEmptyObject(contextUpdateArg)) {
                referencedPosition = applyCommandAtPosition(nextPos, 'context', [
                  contextUpdateArg,
                ]);
              } else {
                referencedPosition = nextPos;
              }
              referencedPosition = {...referencedPosition, from: 'replace'};
              to.push(referencedPosition);
            }
          }
        }
      }
    } else {
      invariant(false, 'Unable to process: %s', instruction.type);
    }
  }
}

function isProvidedBy(position: Position, instruction: Instruction) {
  if (instruction.type === 'execute') {
    return instruction.action.id === position.instruction.action.id;
  } else if (instruction.type === 'include' || instruction.type === 'repeat') {
    for (let i = position.stack.length - 1; i >= 0; i--) {
      if (position.stack[i] === instruction) {
        return true;
      }
    }
    return false;
  } else if (instruction.type === 'replace') {
    // TODO: Decide if want to traverse `from` field.
    return false;
  }
}

function updateContextBySpec(
  domain: Domain,
  {input, output}: {input: RecordType, output: RecordType},
  context: Context,
  originalContext: Context,
  updateSpec: ?ContextUpdateSpec,
): Context {
  const nextContext = {...context};
  if (updateSpec != null) {
    for (const key in updateSpec) {
      const value = updateSpec[key];
      if (typeof value === 'string' && value.startsWith('$')) {
        nextContext[key] = originalContext[value.slice(1)];
      } else {
        nextContext[key] = value;
      }
    }
  } else {
    for (const key in originalContext) {
      if (
        (input.rows[key] != null &&
          input.rows[key].match(originalContext[key], domain)) ||
        (output.rows[key] != null && output.rows[key].match(originalContext[key], domain))
      ) {
        nextContext[key] = originalContext[key];
      }
    }
  }
  return nextContext;
}

function traceWithNoStart(pos: Position | StartPosition): Array<Position> {
  const result = [];
  while (pos.type === 'position') {
    result.unshift(pos);
    pos = pos.prev;
  }
  return result;
}

function isEmptyObject(obj) {
  return typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0;
}
