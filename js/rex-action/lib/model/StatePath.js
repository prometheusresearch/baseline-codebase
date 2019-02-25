/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';
import createLogger from 'debug';

import {splitBySlash, splitByComma, joinWithSlash, joinWithComma} from '../StringUtils';
import * as Environment from '../Environment';
import type {StateConfig, State, Position} from './types';
import * as S from './State';
import * as P from './Position';

const log = createLogger('rex-action:model:StatePath');

/**
 * Deserialize state from `path`.
 */
export function fromPath(path: string, config: StateConfig): State {
  // We need a workaround as FF doesn't behave consistently.
  log('fromPath', path);
  if (Environment.isFirefox()) {
    /* istanbul ignore next */
    path = decodeURIComponent(path);
  }

  let segments = splitBySlash(path).filter(Boolean);
  let state = S.create(config);

  if (segments.length === 0) {
    state = S.advanceToFirst(state);
    return state;
  }

  for (const segment of segments) {
    const m = parsePathSegment(segment);
    if (m == null) {
      break;
    }
    let {actionName, commandName, args} = m;
    state = S.advanceTo(state, actionName, null, {allowInvalidPositions: true});
    if (args || commandName) {
      commandName = commandName || 'default';
      state = S.applyCommandAtCurrentPosition(state, commandName, splitByComma(args));
    }
  }

  return state;
}

/**
 * Serialize ``graph`` object to string suitable to be used as path.
 */
export function toPath(state: State): string {
  invariant(state.position != null, 'Invalid state');
  const breadcrumb = S.breadcrumb(state);
  let path = '/' + joinWithSlash(breadcrumb.map(positionToPathSegment));
  // We need a workaround as FF doesn't behave consistently.
  return path;
}

const PARSE_SEGMENT = /^([a-zA-Z\-\_]+)(?:\.([a-zA-Z_]+))?(?:\[([^\]]+)\])?$/;

function parsePathSegment(segment) {
  let m = PARSE_SEGMENT.exec(segment);
  if (!m) {
    return null;
  }
  let [_, actionName, commandName, args] = m;
  return {actionName, commandName, args};
}

function positionToPathSegment(pos: Position): string {
  let segment = pos.instruction.action.name;
  if (hasCommand(pos)) {
    let {commandName, args} = (pos.command: any);
    const action = pos.instruction.action.element;
    const command = P.getCommandForPosition(pos, commandName);
    invariant(command != null, 'Unable to find command: %s', commandName);
    let commandArgs = args.map((arg, idx) =>
      command.argumentTypes[idx].stringify(action.props, arg));
    if (commandName === 'default') {
      segment = segment + `[${joinWithComma(commandArgs)}]`;
    } else {
      segment = segment + `.${commandName}[${joinWithComma(commandArgs)}]`;
    }
  }
  return segment;
}

function hasCommand(pos: Position): boolean {
  const command = pos.command;
  return command != null &&
    (command.args.length === 0 ||
      (command.args.length > 0 && command.args.some(arg => arg)));
}
