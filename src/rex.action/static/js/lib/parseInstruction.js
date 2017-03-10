/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';
import * as qs from 'qs';
import type {Instruction, IExecute, IInclude, IRepeat, IReplace} from './execution/State';

export type PreInstruction =
  | {type: 'execute', id: string, name: string, then: PreInstruction[]}
  | {type: 'include', id: string, name: string, then: PreInstruction[]}
  | {type: 'repeat', repeat: PreInstruction[], then: PreInstruction[]}
  | {type: 'replace', reference: string};

export function parseInstruction(
  domain: Object,
  actions: Object,
  instruction: PreInstruction[],
): Instruction[] {
  return instruction.map(item => {
    if (item.type === 'execute') {
      const element = actions[item.id];
      const action = {
        id: item.id,
        name: item.name,
        contextTypes: element.props.contextTypes,
        domain,
        commands: element.type.commands,
        element,
      };
      return ({
        type: 'execute',
        action,
        then: parseInstruction(domain, actions, item.then),
      }: IExecute);
    } else if (item.type === 'include') {
      const element = actions[item.id];
      return ({
        type: 'include',
        include: parseInstruction(domain, actions, element.props.path),
        then: parseInstruction(domain, actions, item.then),
      }: IInclude);
    } else if (item.type === 'repeat') {
      return ({
        type: 'repeat',
        repeat: parseInstruction(domain, actions, item.repeat),
        then: parseInstruction(domain, actions, item.then),
      }: IRepeat);
    } else if (item.type === 'replace') {
      return parseReplaceReference(item.reference);
    } else {
      invariant(false, 'Unknown instruction found: %s', item.type);
    }
  });
}

const PARSE_REFERENCE = /([a-zA-Z0-9_\-]+)(\?(.*))?/;

function parseReplaceReference(value: string): IReplace {
  const instruction = {
    type: 'replace',
    traverseBack: 0,
    traverse: [],
  };
  const segments = value.split('/');
  for (let i = 0; i < segments.length; i++) {
    const item = segments[i];
    if (item === '' || item === '') {
      continue;
    } else if (item === '..') {
      instruction.traverseBack -= 1;
    } else {
      const m = PARSE_REFERENCE.exec(item);
      invariant(m != null, 'Invalid replace reference: %s', value);
      const [_1, actionId, _2, contextUpdateValue] = m;
      const contextUpdate = qs.parse(contextUpdateValue);
      instruction.traverse.push({actionId, contextUpdate});
    }
  }
  return instruction;
}
