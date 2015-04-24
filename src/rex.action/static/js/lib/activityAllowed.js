/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

function activityAllowed(context, contextSpec) {
  for (var i = 0; i < contextSpec.in.length; i++) {
    if (context[contextSpec.in[i]] == null) {
      return false;
    }
  }
  return true;
}

module.exports = activityAllowed;
