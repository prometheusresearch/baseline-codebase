/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var request     = require('superagent/superagent');
var ActionTypes = require('./runtime/ActionTypes');
var Actions     = require('./runtime/Actions');

class Router {

  constructor(dispatcher) {
    dispatcher.register(this._onAction.bind(this));
  }

  _onAction(action) {
    switch (action.type) {
      case ActionTypes.PAGE_UPDATE:
        var {params} = action.payload;
        this._update(params);
        break;
    }
  }

  _update(params) {
    request
      .post(window.location.pathname)
      .send(params)
      .set('Accept', 'application/json')
      .end(this._onUpdate.bind(this));
  }

  _onUpdate(err, response) {
    if (err) {
      Actions.pageUpdateError(err);
    } else if (response.status !== 200) {
      var err = new Error(`cannot update state: ${response.text}`);
      Actions.pageUpdateError(err);
    } else {
      Actions.pageUpdateComplete(response.body);
    }
  }

}

module.exports = Router;
