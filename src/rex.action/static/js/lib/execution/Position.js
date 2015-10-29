/**
 * @copyright 2015, Prometheus Research, LLC
 */

import memoize            from 'memoize-decorator';
import invariant          from 'invariant';
import * as Entity        from '../Entity';
import * as Instruction   from './Instruction';
import * as Command       from './Command';

/**
 * Objects of this class represent a position within a wizard execution state.
 */
export default class Position {

  static create(instruction, context = {}, parent = null, index = null) {
    while (Instruction.Repeat.is(instruction)) {
      parent = new this(instruction, context, parent, index);
      instruction = instruction.repeat;
      index = 0;
    }
    return new this(instruction, context, {}, parent, index);
  }

  constructor(
    instruction,
    context = {},
    state = {},
    parent = null,
    index = null,
    command = null
  ) {
    this.instruction = instruction;
    this.context = context;
    this.state = state;
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

  /**
   * Replace context at current position.
   */
  withContext(context) {
    return new Position(
      this.instruction,
      context,
      this.state,
      this.parent,
      this.index,
      this.command
    );
  }

  setState(stateUpdate) {
    let state = {...this.state, ...stateUpdate};
    return new Position(
      this.instruction,
      this.context,
      state,
      this.parent,
      this.index,
      this.command
    );
  }

  /**
   * Execute command at current position.
   */
  executeCommand(commandName, ...args) {
    let command = Command.getCommand(this.element, commandName);
    let context = command.execute(this.element.props, this.context, ...args);
    return new Position(
      this.instruction,
      context,
      this.state,
      this.parent,
      this.index,
      {commandName, args}
    );
  }

  /**
   * React element which should be used to render.
   */
  @memoize
  get element() {
    return this.instruction.element;
  }

  /**
   * Key path.
   */
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

  /**
   * Key.
   */
  @memoize
  get key() {
    return Object
      .keys(this.contextTypes.input.rows)
      .map(k => this.context[k])
      .map(v => Entity.isEntity(v) ? v.id : v)
      .join('__') + '__' + this.action + '__' + this.index;
  }

  /**
   * List of next positions.
   */
  @memoize
  get then() {
    return this._thenWithContext(this.context);
  }

  /**
   * Action ID.
   */
  @memoize
  get action() {
    if (Instruction.Repeat.is(this.instruction)) {
      return null;
    } else {
      return this.instruction.action;
    }
  }

  /**
   * Context types.
   */
  @memoize
  get contextTypes() {
    return this.element.props.contextTypes;
  }

  /**
   * Check if position is allowed.
   */
  @memoize
  get isAllowed() {
    if (Instruction.Start.is(this.instruction)) {
      return true;
    } else {
      return this.contextTypes.input.match(this.context);
    }
  }

  _thenWithContext(context) {
    if (this.instruction.then.length === 0 && this.parent) {
      if (Instruction.Repeat.is(this.instruction)) {
        let thenExit = this.parent._thenWithContext(context);
        let thenLoop = [
          Position.create(
            this.parent.instruction.repeat,
            context,
            this.parent,
            this.index + 1
          )
        ];
        return thenLoop.concat(thenExit);
      } else if (Instruction.ExecuteWizard.is(this.parent.instruction)) {
        let thenExit = this.parent._thenWithContext(context);
        return thenExit;
      } else {
        invariant(
          false,
          'found unknown instruction'
        );
      }
    } else {
      let positions = [];

      for (let i = 0; i < this.instruction.then.length; i++) {
        let position = Position.create(
          this.instruction.then[i],
          context,
          this.parent,
          this.index
        );
        if (Instruction.ExecuteWizard.is(position.instruction)) {
          let rootPosition = Position.create(
            position.element.props.path,
            position.context,
            position,
            position.action,
          );
          positions = positions.concat(rootPosition.then.filter(pos => pos.isAllowed));
        } else {
          positions.push(position);
        }
      }
      return positions;
    }
  }

}

