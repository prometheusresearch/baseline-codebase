// @flow

export function silenceConsoleError() {
  // We override console.error not to spam it.
  let consoleError = console.error;
  beforeEach(function() {
    // $FlowFixMe: ...
    console.error = function() {};
  });
  afterEach(function() {
    // $FlowFixMe: ...
    console.error = consoleError;
  });
}

class PromiseMock {
  onComplete: any => void;
  onError: any => void;

  constructor() {
    // $FlowFixMe: ...
    this.onComplete = null;
    // $FlowFixMe: ...
    this.onError = null;
  }

  then(onComplete: any, onError: any): PromiseMock {
    this.onComplete = onComplete;
    this.onError = onError;
    return this;
  }
}

export function mockPromise(): Promise<any> & {
  onComplete: any => void,
  onError: any => void
} {
  return (new PromiseMock(): any);
}
