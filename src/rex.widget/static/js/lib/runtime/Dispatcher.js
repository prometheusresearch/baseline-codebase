/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var flux = require('flux');

var _actionID = 0;

class Dispatcher extends flux.Dispatcher {

  dispatch(action) {
    action.id = _actionID++;
    console.debug('%c ACTION:', 'background: #eee; color: red;', action.id, action.type, action.payload);
    return super(action);
  }
}

module.exports = new Dispatcher();
