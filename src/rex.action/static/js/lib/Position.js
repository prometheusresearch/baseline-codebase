/**
 * @copyright 2015, Prometheus Research, LLC
 */

import memoize            from 'memoize-decorator';
import * as Instruction   from './Instruction';
import * as ActionCommand from './ActionCommand';
import * as Entity        from './Entity';

export default class Position {

  constructor(
    actions,
    context,
    instruction,
    parent,
    index = null,
    command = null
  ) { // eslint-disable-line max-params
    this.actions = actions;
    this.context = context;
    this.instruction = instruction;
    this.parent = parent;
    this.index = index;
    this.command = command;
  }

  reexecuteCurrentCommand(...args) {
    let {commandName} = this.command;
    return this.executeCommand(commandName, ...args);
  }

  updateContext(contextUpdate) {
    return this.withContext({...this.context, ...contextUpdate});
  }

  withContext(context) {
    return new Position(
      this.actions,
      context,
      this.instruction,
      this.parent,
      this.index,
      this.command
    );
  }

  thenWithContext(context) {
    if (this.parent && this.instruction.then.length === 0) {
      let thenExit = this.parent.thenWithContext(context);
      let thenLoop = [
        Position.fromInstruction(
          this.actions,
          context,
          this.parent.instruction.repeat,
          this.parent,
          this.index + 1
        )
      ];
      return thenLoop.concat(thenExit);
    } else {
      return this.instruction.then.map(inst =>
        Position.fromInstruction(
          this.actions,
          context,
          inst,
          this.parent,
          this.index
        ));
    }
  }

  executeCommand(commandName, ...args) {
    let command = ActionCommand.getCommand(this.element, commandName);
    let context = command.execute(this.element.props, this.context, ...args);
    return new Position(
      this.actions,
      context,
      this.instruction,
      this.parent,
      this.index,
      {commandName, args}
    );
  }

  @memoize
  get element() {
    return this.actions[this.action];
  }

  @memoize
  get keyPath() {
    let keyPath = [];
    if (this.action !== null) {
      keyPath.push(this.action);
    }
    if (this.index !== null) {
      keyPath.push(this.index);
    }
    if (this.parent) {
      return `${this.parent.keyPath}.${keyPath.join('.')}`;
    } else {
      return keyPath.join('.');
    }
  }

  @memoize
  get key() {
    return Object
      .keys(this.contextTypes.input.rows)
      .map(k => this.context[k])
      .map(v => Entity.isEntity(v) ? v.id : v)
      .join('__') + '__' + this.action + '__' + this.index;
  }

  @memoize
  get then() {
    return this.thenWithContext(this.context);
  }

  @memoize
  get action() {
    if (this.instruction instanceof Instruction.Execute) {
      return this.instruction.action;
    } else {
      return null;
    }
  }

  @memoize
  get contextTypes() {
    return this.element.props.contextTypes;
  }

  @memoize
  get isAllowed() {
    if (Instruction.Start.is(this.instruction)) {
      return true;
    } else {
      return this.contextTypes.input.match(this.context);
    }
  }

  static fromInstruction(actions, context, instruction, parent, index = null) {
    while (Instruction.Repeat.is(instruction)) {
      parent = new Position(actions, context, instruction, parent, index);
      index = 0;
      instruction = instruction.repeat;
    }
    return new Position(actions, context, instruction, parent, index);
  }
}

