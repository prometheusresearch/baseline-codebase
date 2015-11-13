/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                             from 'react';
import * as Transitionable               from './Transitionable';
import Port                              from './data/Port';
import Query                             from './data/Query';
import Mutation                          from './data/Mutation';
import resolveURL                        from './resolveURL';
import {Collection, Entity, prop, state} from './DataSpecification';

Transitionable.register('undefined', function decode_widget() { // eslint-disable-line camelcase
  return undefined;
});

Transitionable.register('widget', function decode_widget(payload) { // eslint-disable-line camelcase
  let type = __require__(payload[0]);
  return React.createElement(type, payload[1]);
});

Transitionable.register('url', function decode_url(payload) { // eslint-disable-line camelcase
  return resolveURL(payload[0]);
});

Transitionable.register('port', function decode_port(payload) { // eslint-disable-line camelcase
  return new Port(resolveURL(payload[0]));
});

Transitionable.register('query', function decode_query(payload) { // eslint-disable-line camelcase
  return new Query(resolveURL(payload[0]));
});

Transitionable.register('mutation', function decode_mutation(payload) { // eslint-disable-line camelcase
  return new Mutation(resolveURL(payload[0]));
});

Transitionable.register('collection', function decode_query(payload) { // eslint-disable-line camelcase, max-len
  return new Collection(payload[0], payload[1]);
});

Transitionable.register('entity', function decode_query(payload) { // eslint-disable-line camelcase
  return new Entity(payload[0], payload[1]);
});

Transitionable.register('propbinding', function decode_query(payload) { // eslint-disable-line camelcase, max-len
  return prop(payload[0]);
});

Transitionable.register('statebinding', function decode_query(payload) { // eslint-disable-line camelcase, max-len
  return state(payload[0]);
});
