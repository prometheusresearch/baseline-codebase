/**
 * @copyright 2015, Prometheus Research, LLC
 */

class Instruction {

  constructor(then) {
    this.then = then;
  }

  static is(obj) {
    return obj instanceof this;
  }
}

export class Start extends Instruction {

  constructor(then) {
    super(then);
    this.action = null;
  }
}

export class Execute extends Instruction {

  constructor(action, then) {
    super(then);
    this.action = action;
  }
}

export class Repeat extends Instruction {

  constructor(repeat, then) {
    super(then);
    this.repeat = repeat;
  }
}
