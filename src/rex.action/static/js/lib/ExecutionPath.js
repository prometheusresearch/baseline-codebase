/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as StringUtils   from './StringUtils';
import Execution          from './execution/Execution';
import * as Command       from './execution/Command';

const PARSE_SEGMENT = /^([a-zA-Z\-\_]+)(?:\.([a-zA-Z_]+))?(?:\[([^\]]+)\])?$/;

/**
 * Deserialize ``execution`` object from string.
 */
export function fromPath(path, instruction, initialContext) {
  let segments = StringUtils.splitBySlash(path).filter(Boolean);

  let execution = Execution.create(instruction, initialContext, false);

  if (segments.length === 0) {
    execution = execution.advance();
    return execution;
  }

  segments.forEach(segment => {
    let m = PARSE_SEGMENT.exec(segment);
    if (!m) {
      return;
    }
    let [_, action, commandName, args] = m;

    // advance to the action
    let keyPath = execution.position.then.find(pos => pos.action === action).keyPath;
    execution = execution.advance(keyPath, undefined, false);

    // execute action command if any
    if (args || commandName) {
      commandName = commandName || 'default';
      let command = Command.getCommand(
          execution.position.element,
          commandName);
      args = StringUtils.splitByComma(args);
      args = args.map((arg, idx) =>
        command.argumentTypes[idx].parse(execution.position.element, arg));
      execution = execution.executeCommandAtCurrentPosition_(commandName, ...args);
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
    let command = Command.getCommand(position.element, commandName);
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
