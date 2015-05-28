/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Transitionable    = require('rex-widget/lib/Transitionable');
var {ContextBinding}  = require('./DataSpecification');

Transitionable.register('contextbinding', function decode_query(payload) {
  return new ContextBinding(payload[0], payload[1]);
});
