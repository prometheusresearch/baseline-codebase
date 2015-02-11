/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var runtime = require('./runtime');
var invariant = require('./invariant');

var REF_RE = /\$__([0-9])+__/;

function renderTemplatedString(string) {
  if (string && string.template && string.refs) {
    return string.template.replace(REF_RE, function(_, index) {
      return runtime.ApplicationState.get(string.refs[index]);
    });
  } else {
    return string;
  }
}

window.r = module.exports = renderTemplatedString;
