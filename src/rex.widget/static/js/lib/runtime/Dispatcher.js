/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var flux = require('flux');

class Dispatcher extends flux.Dispatcher {

  dispatch(action) {
    console.debug('%c ACTION:', 'background: #eee; color: red;', action.type, action.payload);
    return super(action);
  }
}

module.exports = new Dispatcher();
