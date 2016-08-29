/**
 * @copyright 2016, Prometheus Research, LLC
 */

import {
  Graph,
  Command
} from './execution';

import {
  splitBySlash,
  splitByComma,
  joinWithSlash,
  joinWithComma
} from './StringUtils';

const PARSE_SEGMENT = /^([a-zA-Z\-\_]+)(?:\.([a-zA-Z_]+))?(?:\[([^\]]+)\])?$/;

/* istanbul ignore next */
function isFirefox() {
  return navigator.userAgent.search('Firefox') > -1;
}

/**
 * Deserialize ``graph`` object from string.
 */
export function fromPath(path, instruction, actions, initialContext, domain) {
  // We need a workaround as FF doesn't behave consistently.
  if (isFirefox()) {
    /* istanbul ignore next */
    path = decodeURIComponent(path);
  }

  let segments = splitBySlash(path).filter(Boolean);

  let graph = Graph.create(instruction, actions, initialContext, domain, false);

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
      args = splitByComma(args);
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
  let path = '/' + joinWithSlash(graph.trace.slice(1).map(_nodeToPath));
  // We need a workaround as FF doesn't behave consistently.
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
      segment = segment + `[${joinWithComma(commandArgs)}]`;
    } else {
      segment = segment + `.${commandName}[${joinWithComma(commandArgs)}]`;
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
