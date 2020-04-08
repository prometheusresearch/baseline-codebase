/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';

import type {Position, Context, Entity, State, StateConfig} from './types';
import * as P from './Position';
import * as E from './Entity';
import * as C from './Command';

export function create({instruction, context}: StateConfig): State {
  const startPosition = {
    type: 'start-position',
    instruction,
    context,
  };
  return {
    position: startPosition,
    context,
  };
}

export function positions(state: State): Position[] {
  let positions: Position[] = [];
  let curr = state.position;
  while (curr.type !== "start-position") {
    positions.unshift(curr);
    curr = curr.prev;
  }
  return positions;
}

export function next(state: State): Position[] {
  return P.nextPosition(state.position);
}

export function sibling(state: State): Position[] {
  const currentPosition = state.position;
  if (currentPosition.type === 'start-position') {
    return [];
  } else {
    return P.nextPosition(currentPosition.prev);
  }
}

export function close(state: State, _actionId: string): State {
  // TODO: implement
  return state;
}

export function returnTo(state: State, actionId: string): State {
  const currentPos = state.position;
  invariant(currentPos.type === 'position', 'Invalid state');
  const nextPos = P.findPosition(
    currentPos,
    pos => pos.instruction.action.id === actionId,
  );
  invariant(nextPos != null, 'Cannot return to %s: no such action', actionId);
  return {...state, position: nextPos};
}

export function advanceTo(
  state: State,
  actionIdOrName: string,
  contextUpdate: ?Context,
  {allowInvalidPositions}: {allowInvalidPositions?: boolean} = {},
): State {
  const nextPos = next(state)
    .map(pos => P.updatePositionContext(pos, contextUpdate))
    .filter(p => allowInvalidPositions ? true : P.isPositionAllowed(p))
    .find(
      pos =>
        pos.instruction.action.id === actionIdOrName ||
        pos.instruction.action.name === actionIdOrName,
    );
  invariant(nextPos != null, 'Unable to advance wizard to position: %s', actionIdOrName);
  return {...state, position: nextPos};
}

export function advanceToFirst(state: State, contextUpdate?: Context): State {
  const nextPosList = next(state).map(pos => P.updatePositionContext(pos, contextUpdate));
  const nextPosListAllowed = nextPosList.filter(P.isPositionAllowed);
  if (nextPosListAllowed.length === 0) {
    return state;
  }
  const nextPos = nextPosListAllowed[0];
  return {...state, position: nextPos};
}

export function replaceCurrentPositionWithSibling(state: State, actionId: string): State {
  const currentPos = state.position;
  invariant(currentPos.type === 'position', 'Invalid state');
  const nextState = {...state, position: currentPos.prev};
  return advanceTo(nextState, actionId);
}

export function setStateAtCurrentPosition(state: State, stateUpdate: Object): State {
  invariant(state.position.type === 'position', 'Invalid state');
  const nextPosition = {
    type: 'position',
    ...state.position,
    state: {...state.position.state, ...stateUpdate},
  };
  return {...state, position: nextPosition};
}

export function applyCommandAtCurrentPosition(
  state: State,
  commandName: string,
  args: any[],
): State {
  invariant(state.position.type === 'position', 'Invalid state');
  const nextPosition = P.applyCommandAtPosition(state.position, commandName, args);
  return {...state, position: nextPosition};
}

export function forEachPosition(state: State, f: (Position) => *) {
  let cur = state.position;
  while (cur.type === 'position') {
    f(cur);
    cur = cur.prev;
  }
}

export function mapPosition(state: State, f: (Position) => ?Position): State {
  const trace = breadcrumb(state);
  // that's a start position now
  let prev = trace[0].prev;
  for (let i = 0; i < trace.length; i++) {
    let pos = f(trace[i]);
    if (pos == null || pos.type !== 'position') {
      break;
    }
    pos = {type: 'position', ...pos, prev};
    prev = pos;
  }
  return {...state, position: prev};
}

export function breadcrumb(state: State): Position[] {
  const trace = [];
  let pos = state.position;
  while (pos.type === 'position') {
    trace.unshift(pos);
    pos = pos.prev;
  }
  return trace;
}

export function updateEntity(
  state: State,
  prevEntity: Entity,
  nextEntity: ?Entity,
): State {
  // allow to advance to replace if any
  const nextPos = next(state);
  if (nextPos.length > 0) {
    state = advanceToFirst(state);
  }

  state = mapPosition(state, pos => {
    const nextContext = replaceEntityInContext(pos.context, prevEntity, nextEntity);
    let nextPos = {...pos, context: nextContext};
    if (!P.isPositionAllowed(nextPos)) {
      return null;
    }
    if (nextPos.command != null) {
      let args;
      // special case for onContextCommand which require specifics for arg
      // processing
      if (nextPos.command.commandName === C.onContextCommand.name) {
        // eslint-disable-next-line no-loop-func
        args = nextPos.command.args.map(arg => {
          return replaceEntityInContext(arg, prevEntity, nextEntity);
        });
      } else {
        // eslint-disable-next-line no-loop-func
        args = nextPos.command.args.map(arg => {
          return replaceEntity(arg, prevEntity, nextEntity);
        });
      }
      nextPos = P.applyCommandAtPosition(nextPos, nextPos.command.commandName, args);
    }
    return nextPos;
  });

  return state;
}

/**
 * Produce a new context with the `prevEntity` replaced with the `nextEntity`.
 */
function replaceEntityInContext(
  context: Object,
  prevEntity: Entity,
  nextEntity: ?Entity,
): Object {
  let nextContext = {};
  for (let key in context) {
    if (!context[key]) {
      continue;
    }
    let nextItem = replaceEntity(context[key], prevEntity, nextEntity);
    if (nextItem != null) {
      nextContext[key] = nextItem;
    }
  }
  return nextContext;
}

function replaceEntity(obj: any, prevEntity: Entity, nextEntity: ?Entity): any {
  if (!E.isEntity(obj)) {
    return obj;
  }
  const entity: Entity = (obj: any);
  if (
    E.getEntityType(entity) === E.getEntityType(prevEntity) && entity.id === prevEntity.id
  ) {
    return nextEntity;
  } else {
    return obj;
  }
}
