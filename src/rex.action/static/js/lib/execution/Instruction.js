/**
 * @copyright 2015, Prometheus Research, LLC
 */

export class Instruction {

  constructor(then) {
    this.then = then;
  }

  static is(obj) {
    return obj.constructor === this;
  }
}

export class Start extends Instruction {

  constructor(then) {
    super(then);
    this.action = null;
  }
}

export class Execute extends Instruction {

  constructor(action, then, element) {
    super(then);
    this.action = action;
    this.element = element;
  }
}

export class IncludeWizard extends Instruction {

  constructor(action, then, element) {
    super(then);
    this.action = action;
    this.element = element;
  }
}

export class Replace extends Instruction {

  constructor(replace) {
    super([]);
    this.replace = replace;
  }
}

export class Repeat extends Instruction {

  constructor(repeat, then) {
    super(then);
    this.repeat = repeat;
  }
}
