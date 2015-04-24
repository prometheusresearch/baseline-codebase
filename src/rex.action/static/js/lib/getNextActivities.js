/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var activityAllowed = require('./activityAllowed');

function getNextActivities(context, activities) {
  var nextActivities = [];
  for (var id in activities) {
    var activity = activities[id];
    if (activityAllowed(context, activity.props.contextSpec)) {
      var rank = Object.keys(context).length === activity.props.contextSpec.in.length ? 1 : 0.5;
      nextActivities.push({activity, id, rank})
    }
    var contextSpec = activity.props.contextSpec;
  }
  return nextActivities;
}

module.exports = getNextActivities;
