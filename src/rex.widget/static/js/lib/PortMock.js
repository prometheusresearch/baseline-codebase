/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Port    from './Port';

export default class PortMock extends Port {

  constructor(responses) {
    super();
    this.responses = responses || [];
    this.produceCalls = [];
    this.replaceCalls = [];
  }

  produce(params) {
    this.produceCalls.push({params});
    return this._mockedRequest();
  }

  replace(prevEntity, entity, params) {
    this.replaceCalls.push({prevEntity, entity, params});
    return this._mockedRequest();
  }

  _mockedRequest() {
    return new Promise((resolve, reject) => {
      let response = this.responses.shift();
      if (response instanceof Error) {
        reject(response);
      } else {
        resolve(response);
      }
    });
  }
}
