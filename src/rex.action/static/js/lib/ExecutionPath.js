/**
 * @copyright 2015, Prometheus Research, LLC
 */

import invariant          from 'invariant';
import {Start}            from './Instruction';
import * as Execution     from './Execution';
import Position           from './Position';
import * as StringUtils   from './StringUtils';
import * as ActionCommand from './ActionCommand';

const PARSE_SEGMENT = /^([a-zA-Z\-\_]+)(?:\.([a-zA-Z_]+))?(?:\[([^\]]+)\])?$/;

/**
 * Deserialize ``execution`` object from string.
 */
export function fromPath(path, actions, instruction, initialContext) {
  let segments = StringUtils.splitBySlash(path).filter(Boolean);

  if (segments.length === 0) {
    return Execution.start(actions, instruction, initialContext);
  }

  initialContext = {...Execution.DEFAULT_INITIAL_CONTEXT, ...initialContext};
  invariant(
    Start.is(instruction),
    'Can only start wizard from a "Start" instruction'
  );
  let position = new Position(actions, {}, instruction, null, null);
  let execution = new Execution.Execution(actions, [position]);

  segments.forEach(segment => {
    let m = PARSE_SEGMENT.exec(segment);
    if (!m) {
      return;
    }
    let [_, action, commandName, args] = m;

    // advance to the action
    let keyPath = execution.position.then.find(pos => pos.action === action).keyPath;
    execution = Execution.advance(execution, keyPath, undefined, false);

    // execute action command if any
    if (args || commandName) {
      commandName = commandName || 'default';
      let command = ActionCommand.getCommand(
          execution.position.element,
          commandName);
      args = StringUtils.splitByComma(args);
      args = args.map((arg, idx) =>
        command.argumentTypes[idx].parse(execution.position.element, arg));
      execution = Execution.executeCommandAtCurrentPosition_(execution, commandName, ...args);
    }
  });

  return execution;
}

/**
 * Serialize ``execution`` object to string suitable to be used as path.
 */
export function toPath(execution) {
  return '/' + StringUtils.joinWithSlash(execution.trace.slice(1).map(_positionToPath));
}

function _positionToPath(position) {
  let segment = position.action;
  if (position.index) {
    // TODO:
  }
  if (hasCommand(position)) {
    let {commandName, args} = position.command;
    let command = ActionCommand.getCommand(position.element, commandName);
    let commandArgs = args.map((arg, idx) =>
        command.argumentTypes[idx].stringify(position.element, arg));
    if (commandName === 'default') {
      segment = segment + `[${StringUtils.joinWithComma(commandArgs)}]`;
    } else {
      segment = segment + `.${commandName}[${StringUtils.joinWithComma(commandArgs)}]`;
    }
  }
  return segment;
}

function hasCommand(position) {
  return (
    position.command && (
      position.command.args.length === 0 ||
      position.command.args.length > 0 &&
      position.command.args.some(arg => arg)
    )
  );
}
