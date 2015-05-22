/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

function getNextActions(context, actions) {
  var nextActions = [];
  for (var id in actions) {
    var action = actions[id];
    if (actionAllowedInContext(context, action)) {
      var rank = Object.keys(context).length === Object.keys(action.props.input).length ? 1 : 0.5;
      nextActions.push({action, id, rank})
    }
  }
  return nextActions;
}

function actionAllowedInContext(context, action) {
  var keys = Object.keys(action.props.input);
  for (var i = 0; i < keys.length; i++) {
    if (context[keys[i]] == null) {
      return false;
    }
  }
  return true;
}

module.exports = getNextActions;
module.exports.actionAllowedInContext = actionAllowedInContext;
