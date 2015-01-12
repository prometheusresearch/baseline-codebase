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
   * Update page.
   */
  pageUpdate(params) {
    Dispatcher.dispatch({
      type: ActionTypes.PAGE_UPDATE,
      payload: {params}
    });
  },

  /**
   * Page update complete.
   */
  pageUpdateComplete(payload) {
    Dispatcher.dispatch({
      type: ActionTypes.PAGE_UPDATE_COMPLETE,
      payload
    });
  },

  /**
   * Page update error.
   */
  pageUpdateError(error) {
    Dispatcher.dispatch({
      type: ActionTypes.PAGE_UPDATE_ERROR,
      payload: {error}
    });
  }

};

module.exports = Actions;
