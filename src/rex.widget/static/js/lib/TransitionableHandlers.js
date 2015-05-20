/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                       = require('react');
var Transitionable              = require('./Transitionable');
var Port                        = require('./Port');
var Query                       = require('./Query');
var resolveURL                  = require('./resolveURL');
var {Collection, Entity, prop}  = require('./DataSpecification');

Transitionable.register('undefined', function decode_widget() {
  return undefined;
});

Transitionable.register('widget', function decode_widget(payload) {
  var type = __require__(payload[0]);
  return React.createElement(type, payload[1]);
});

Transitionable.register('url', function decode_url(payload) {
  return resolveURL(payload[0]);
});

Transitionable.register('port', function decode_port(payload) {
  return new Port(resolveURL(payload[0]));
});

Transitionable.register('query', function decode_query(payload) {
  return new Query(resolveURL(payload[0]));
});

Transitionable.register('collection', function decode_query(payload) {
  return new Collection(payload[0], payload[1]);
});

Transitionable.register('entity', function decode_query(payload) {
  return new Entity(payload[0], payload[1]);
});

Transitionable.register('propbinding', function decode_query(payload) {
  return prop(payload[0]);
});
