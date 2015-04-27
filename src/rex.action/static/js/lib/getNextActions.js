/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

function getNextActions(context, actions) {
  var nextActions = [];
  for (var id in actions) {
    var action = actions[id];
    if (actionAllowedInContext(context, action)) {
      var rank = Object.keys(context).length === action.props.contextSpec.in.length ? 1 : 0.5;
      nextActions.push({action, id, rank})
    }
    var contextSpec = action.props.contextSpec;
  }
  return nextActions;
}

function actionAllowedInContext(context, action) {
  var contextSpec = action.props.contextSpec;
  for (var i = 0; i < contextSpec.in.length; i++) {
    if (context[contextSpec.in[i]] == null) {
      return false;
    }
  }
  return true;
}

module.exports = getNextActions;
