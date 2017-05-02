/**
 * @flow
 */

import invariant from 'invariant';
import type {Instruction} from './types';

export function visit(
  instruction: Instruction,
  f: (instruction: Instruction, parent: ?Instruction) => *,
) {
  const queue = [{instruction, parent: null}];
  while (queue.length > 0) {
    const {instruction, parent} = queue.shift();
    f(instruction, parent);
    switch (instruction.type) {
      case 'start':
      case 'execute':
        queue.push(
          ...instruction.then.map(next => ({instruction: next, parent: instruction})),
        );
        break;
      case 'include':
        queue.push({instruction: instruction.include, parent: instruction});
        queue.push(
          ...instruction.then.map(next => ({instruction: next, parent: instruction})),
        );
        break;
      case 'repeat':
        queue.push(
          ...instruction.then.map(next => ({instruction: next, parent: instruction})),
        );
        queue.push(
          ...instruction.repeat.map(next => ({instruction: next, parent: instruction})),
        );
        break;
      case 'replace':
        break;
      default:
        invariant(false, 'Unknown instruction type: "%s"', instruction.type);
    }
  }
}
