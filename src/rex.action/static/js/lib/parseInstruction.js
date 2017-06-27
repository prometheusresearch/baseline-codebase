/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';
import * as qs from 'qs';
import type {
  Instruction,
  IStart,
  IExecute,
  IInclude,
  IRepeat,
  IReplace,
} from './model/types';

export type PreInstruction =
  | {type: 'start', then: PreInstruction[]}
  | {type: 'execute', id: string, name: string, then: PreInstruction[]}
  | {type: 'include', id: string, name: string, then: PreInstruction[]}
  | {type: 'repeat', repeat: PreInstruction[], then: PreInstruction[]}
  | {type: 'replace', reference: string};

export function parseInstruction(
  domain: Object,
  actions: Object,
  instruction: PreInstruction,
): Instruction {
  const ctx = {path: []};
  return parseInstructionImpl(domain, actions, instruction, ctx);
}

export function parseInstructionImpl(
  domain: Object,
  actions: Object,
  instruction: PreInstruction,
  ctx: {path: Array<string>},
): Instruction {
  if (instruction.type === 'start') {
    const then = instruction.then.map(i => parseInstructionImpl(domain, actions, i, ctx));
    const res: IStart = {
      type: 'start',
      then,
      parent: null,
    };
    assignParent(then, res);
    return res;
  } else if (instruction.type === 'execute') {
    const element = lookupAction(instruction, actions, ctx);
    const action = {
      id: instruction.id,
      name: instruction.name,
      contextTypes: element.props.contextTypes,
      domain,
      commands: element.type.commands,
      element,
    };
    const then = instruction.then.map(i => parseInstructionImpl(domain, actions, i, ctx));
    const res: IExecute = {
      type: 'execute',
      action,
      then,
      parent: null,
    };
    assignParent(then, res);
    return res;
  } else if (instruction.type === 'include') {
    const element = lookupAction(instruction, actions, ctx);
    const include = parseInstructionImpl(domain, actions, element.props.path, {
      ...ctx,
      path: ctx.path.concat(instruction.id),
    });
    invariant(include.type === 'start', 'Invalid include');
    const then = instruction.then.map(i => parseInstructionImpl(domain, actions, i, ctx));
    const res: IInclude = {
      type: 'include',
      name: instruction.name,
      include,
      then,
      parent: null,
    };
    assignParent([include], res);
    assignParent(then, res);
    return res;
  } else if (instruction.type === 'repeat') {
    const repeat = instruction.repeat.map(i =>
      parseInstructionImpl(domain, actions, i, ctx));
    const then = instruction.then.map(i => parseInstructionImpl(domain, actions, i, ctx));
    const res: IRepeat = {
      type: 'repeat',
      repeat,
      then,
      parent: null,
    };
    assignParent(repeat, res);
    assignParent(then, res);
    return res;
  } else if (instruction.type === 'replace') {
    return parseReplaceReference(instruction.reference);
  } else {
    invariant(false, 'Unknown instruction found: %s', instruction.type);
  }
}

function lookupAction(instruction, actions, ctx) {
  const elementKey = ctx.path.concat(instruction.id).join('@');
  const element = actions[elementKey];
  if (element.$ref !== undefined) {
    return actions[element.$ref];
  } else {
    return element;
  }
}

function assignParent(instructions, parent) {
  for (let i = 0; i < instructions.length; i++) {
    instructions[i].parent = parent;
  }
}

const PARSE_REFERENCE = /([a-zA-Z0-9_\-]+)\?(.*)/;

export function parseReplaceReference(value: string): IReplace {
  const instruction = {
    type: 'replace',
    traverseBack: 0,
    traverse: [],
    parent: null,
  };
  const segments = value.split('/');
  for (let i = 0; i < segments.length; i++) {
    const item = segments[i];
    if (item === '' || item === '.') {
      continue;
    } else if (item === '..') {
      instruction.traverseBack += 1;
    } else {
      const m = PARSE_REFERENCE.exec(item);
      if (m != null) {
        const [_1, actionName, contextUpdateValue] = m;
        const contextUpdate = qs.parse(contextUpdateValue);
        instruction.traverse.push({actionName, contextUpdate});
      } else {
        instruction.traverse.push({actionName: item, contextUpdate: null});
      }
    }
  }
  return instruction;
}
