/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Port    = require('./Port');

class PortMock extends Port {

  constructor(responses) {
    super();
    this.responses = responses || [];
    this.produceCalls = [];
    this.replaceCalls = [];
  }

  produce(params, options) {
    this.produceCalls.push({params});
    return this._mockedRequest();
  }

  replace(prevEntity, entity, params, options) {
    this.replaceCalls.push({prevEntity, entity, params});
    return this._mockedRequest();
  }

  _mockedRequest() {
    return new Promise((resolve, reject) => {
      var response = this.responses.shift();
      if (response instanceof Error) {
        reject(response);
      } else {
        resolve(response);
      }
    });
  }
}

module.exports = PortMock;
