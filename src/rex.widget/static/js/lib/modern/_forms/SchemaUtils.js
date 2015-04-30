/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var _validator = require('is-my-json-valid');

function validator(schema, options) {
  options = {...options, greedy: true};
  return _validator(schema, options);
}

module.exports = {validator};
