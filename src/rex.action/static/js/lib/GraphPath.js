/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as StringUtils   from './StringUtils';
import Graph          from './execution/Graph';
import * as Command       from './execution/Command';

const PARSE_SEGMENT = /^([a-zA-Z\-\_]+)(?:\.([a-zA-Z_]+))?(?:\[([^\]]+)\])?$/;

/**
 * Deserialize ``graph`` object from string.
 */
export function fromPath(path, instruction, initialContext) {
  // Line below is to workaround needless encoding of single quote ' into %27 in
  // Firefox.
  path = path.replace(/\%27/g, "'");

  let segments = StringUtils.splitBySlash(path).filter(Boolean);

  let graph = Graph.create(instruction, initialContext, false);

  if (segments.length === 0) {
    graph = graph.advance();
    return graph;
  }

  segments.forEach(segment => {
    let m = PARSE_SEGMENT.exec(segment);
    if (!m) {
      return;
    }
    let [_, action, commandName, args] = m;

    // advance to the action
    let keyPath = graph.node.then.find(pos => pos.action === action).keyPath;
    graph = graph.advance(keyPath);

    // execute action command if any
    if (args || commandName) {
      commandName = commandName || 'default';
      let command = Command.getCommand(
          graph.node.element,
          commandName);
      args = StringUtils.splitByComma(args);
      args = args.map((arg, idx) =>
        command.argumentTypes[idx].parse(graph.node.element, arg));
      graph = graph.executeCommandAtCurrentNodeAndNoAdvance(commandName, ...args);
    }
  });

  return graph;
}

/**
 * Serialize ``graph`` object to string suitable to be used as path.
 */
export function toPath(graph) {
  let path = '/' + StringUtils.joinWithSlash(graph.trace.slice(1).map(_nodeToPath));

  // Line below is to workaround needless encoding of single quote ' into %27 in
  // Firefox.
  path = path.replace(/'/g, '%27');

  return path;
}

function _nodeToPath(node) {
  let segment = node.action;
  if (node.index) {
    // TODO:
  }
  if (hasCommand(node)) {
    let {commandName, args} = node.command;
    let command = Command.getCommand(node.element, commandName);
    let commandArgs = args.map((arg, idx) =>
        command.argumentTypes[idx].stringify(node.element, arg));
    if (commandName === 'default') {
      segment = segment + `[${StringUtils.joinWithComma(commandArgs)}]`;
    } else {
      segment = segment + `.${commandName}[${StringUtils.joinWithComma(commandArgs)}]`;
    }
  }
  return segment;
}

function hasCommand(node) {
  return (
    node.command && (
      node.command.args.length === 0 ||
      node.command.args.length > 0 &&
      node.command.args.some(arg => arg)
    )
  );
}
