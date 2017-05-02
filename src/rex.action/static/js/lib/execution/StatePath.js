/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';
import {splitBySlash, splitByComma, joinWithSlash, joinWithComma} from '../StringUtils';
import * as Environment from '../Environment';
import * as S from './State';

/**
 * Deserialize state from `path`.
 */
export function fromPath(path: string, config: S.Config): S.State {
  // We need a workaround as FF doesn't behave consistently.
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

  segments.forEach(segment => {
    const m = parsePathSegment(segment);
    if (m == null) {
      return;
    }
    let {actionId, commandName, args} = m;
    state = S.advanceTo(state, actionId);
    if (args || commandName) {
      commandName = commandName || 'default';
      state = S.applyCommandAtCurrentPosition(state, commandName, splitByComma(args));
    }
  });

  return state;
}

/**
 * Serialize ``graph`` object to string suitable to be used as path.
 */
export function toPath(state: S.State): string {
  invariant(state.position != null, 'Invalid state');
  const breadcrumb = state.position.trace.concat(state.position);
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
  let [_, actionId, commandName, args] = m;
  return {actionId, commandName, args};
}

function positionToPathSegment(pos: S.Position): string {
  let segment = pos.instruction.action.id;
  if (hasCommand(pos)) {
    let {commandName, args} = (pos.command: any);
    const action = pos.instruction.action.element;
    const command = S.getActionCommand(pos.instruction.action, commandName);
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

function hasCommand(pos: S.Position): boolean {
  const command = pos.command;
  return command != null &&
    (command.args.length === 0 ||
      (command.args.length > 0 && command.args.some(arg => arg)));
}
