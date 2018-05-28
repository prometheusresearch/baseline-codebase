/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

import type {Command} from './Command';
import type {RecordType, EntityType} from './Type';

export type {Command};
export type {RecordType, EntityType};

/**
 * Abstract instruction.
 */
export type Instruction = IStart | IInclude | IExecute | IReplace | IRepeat;

/**
 * Instruction which can contain other instructions.
 */
export type ContainerInstruction = IInclude | IRepeat;

export type IStart = {
  type: 'start',
  then: Instruction[],
  parent: ?Instruction,
};

/**
 * Execute an action (render a piece of UI to a user).
 */
export type IExecute = {
  type: 'execute',
  action: ActionSpec,
  then: Instruction[],
  parent: ?Instruction,
};

export type ActionSpec = {
  id: string,
  name: string,
  title?: string,
  domain: Domain,
  element: React$Element<*>,
  commands: {
    [commandName: string]: Command,
  },
  contextTypes: {
    input: RecordType,
    output: RecordType,
  },
};

/**
 * Include another set of instructions.
 */
export type IInclude = {
  type: 'include',
  name: string,
  include: IStart,
  then: Instruction[],
  parent: ?Instruction,
};

/**
 * Repeat a set of instructions.
 */
export type IRepeat = {
  type: 'repeat',
  repeat: Instruction[],
  then: Instruction[],
  parent: ?Instruction,
};

/**
 * Replace the with the reference and the context update.
 */
export type IReplace = {
  type: 'replace',
  traverseBack: number,
  traverse: Array<{
    actionName: string,
    contextUpdate: ?Context,
  }>,
  parent: ?Instruction,
};

export type StartPosition = {
  +type: 'start-position',

  +instruction: IStart,
  +context: Context,
};

export type Position = {
  +type: 'position',

  +context: Context,
  +state: ActionState,
  +command?: {commandName: string, args: any[]},

  +instruction: IExecute,
  +stack: ContainerInstruction[],
  +prev: StartPosition | Position,

  +from?: 'replace',
};

export type Entity = {
  [prop: string]: mixed,
  id: number | string,
  'meta:type': string,
  'meta:title'?: ?string,
  __title__?: ?string,
  title?: ?string,
};

export type Context = {
  [key: string]: ContextValue,
};

// This is actually $key but we won't encode it in type system
type ContextKey = string;

type ContextValue = string | number | boolean;

export type ContextUpdateSpec = {
  [key: string]: ContextValue | ContextKey,
};

export type Domain = {
  [entityName: string]: {
    [stateName: string]: {
      expression: Function,
    },
  },
};

export type ActionState = {
  [name: string]: string,
};

export type StateConfig = {
  context: Context,
  instruction: IStart,
};

export type State = {
  position: StartPosition | Position,
  context: Context,
};
