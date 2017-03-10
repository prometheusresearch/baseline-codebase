/**
 * @copyright 2017, Prometheus Research, LLC
 * @flow
 */

/**
 * Abstract base class for wizard instructions.
 */
export class Instruction {
  then: Instruction[];

  constructor(then: Instruction[]) {
    this.then = then;
  }

  static is(obj: any): boolean {
    return obj && obj.constructor === this;
  }
}

/**
 * Initial instruction.
 *
 * Wizard execution starts here.
 */
export class Start extends Instruction {
  action: null;
  constructor(then: Instruction[]) {
    super(then);
    this.action = null;
  }
}

/**
 * Execute action.
 */
export class Execute extends Instruction {
  id: string;
  action: string;
  element: React$Element<*>;

  constructor(
    id: string,
    action: string,
    then: Instruction[],
    element: React$Element<*>,
  ) {
    super(then);
    this.id = id;
    this.action = action;
    this.element = element;
  }
}

/**
 * Execute subwizard
 */
export class IncludeWizard extends Instruction {
  id: string;
  action: ?mixed;
  element: React$Element<*>;

  constructor(id: string, action: mixed, then: Instruction[], element: React$Element<*>) {
    super(then);
    this.id = id;
    this.action = action;
    this.element = element;
  }
}

/**
 * Replace current path with another one specified with `replace` reference.
 */
export class Replace extends Instruction {
  replace: string;

  constructor(replace: string) {
    super([]);
    this.replace = replace;
  }
}

/**
 * Repeat `repeat` section and then go to `then`.
 */
export class Repeat extends Instruction {
  repeat: Instruction[];

  constructor(repeat: Instruction[], then: Instruction[]) {
    super(then);
    this.repeat = repeat;
  }
}
