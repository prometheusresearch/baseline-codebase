/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import * as Transitionable from './Transitionable';
import {port, query, mutation, request} from './data';
import resolveURL from './resolveURL';

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
  return port(resolveURL(payload[0]));
});

Transitionable.register('query', function decode_query(payload) { // eslint-disable-line camelcase
  return query(resolveURL(payload[0]));
});

Transitionable.register('mutation', function decode_mutation(payload) { // eslint-disable-line camelcase
  return mutation(resolveURL(payload[0]));
});

Transitionable.register('request_url', function decode_request_url(payload) { // eslint-disable-line camelcase
  return request(resolveURL(payload[0]));
});
