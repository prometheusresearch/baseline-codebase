/**
 * All possible application actions.
 *
 * @copyright Prometheus Research, LLC
 */
'use strict';

var Dispatcher  = require('./Dispatcher');
var ActionTypes = require('./ActionTypes');

var Actions = {

  /**
   * Initialize page.
   */
  pageInit(payload) {
    Dispatcher.dispatch({
      type: ActionTypes.PAGE_INIT,
      payload
    });
  },

  /**
   * Page state update.
   */
  pageStateUpdate(payload) {
    Dispatcher.dispatch({
      type: ActionTypes.PAGE_STATE_UPDATE,
      payload
    });
  },

  /**
   * Page state update complete.
   */
  pageStateUpdateComplete(payload, notifications, stateOverride) {
    Dispatcher.dispatch({
      type: ActionTypes.PAGE_STATE_UPDATE_COMPLETE,
      payload: {payload, notifications, stateOverride}
    });
  },

  /**
   * Page state update error.
   */
  pageStateUpdateError(error) {
    Dispatcher.dispatch({
      type: ActionTypes.PAGE_STATE_UPDATE_ERROR,
      payload: {error}
    });
  }

};

module.exports = Actions;
