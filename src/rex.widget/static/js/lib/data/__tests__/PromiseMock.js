/**
 * @copyright 2015, Prometheus Research, LLC
 */

export default class PromiseMock {

  constructor() {
    this.onComplete = null;
    this.onError = null;
  }

  then(onComplete, onError) {
    this.onComplete = onComplete;
    this.onError = onError;
    return this;
  }
}

