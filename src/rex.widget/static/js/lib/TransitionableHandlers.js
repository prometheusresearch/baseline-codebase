/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import generateFunction from 'generate-function';
import * as Transitionable from './Transitionable';
import {port, query, mutation, request} from './data';
import resolveURL from './resolveURL';

/* istanbul ignore next */
Transitionable.register('undefined', function decode_widget() { // eslint-disable-line camelcase
  return undefined;
});

/* istanbul ignore next */
Transitionable.register('widget', function decode_widget(payload) { // eslint-disable-line camelcase
  let module = __require__(payload[0]);
  let type = module.default ? module.default : module;
  return React.createElement(type, payload[1]);
});

/* istanbul ignore next */
Transitionable.register('formfield', function decode_widget(payload) { // eslint-disable-line camelcase
  let formfield = {...payload};
  if (formfield.hideIf) {
    formfield.hideIf = _compileHideIf(formfield.hideIf);
  }
  return formfield;
});

/* istanbul ignore next */
function _compileHideIf(expression) {
  let func = generateFunction();
  /* eslint-disable quotes */
  func(`function hideIf($value, $fields) {`);
  func(`return (${expression});`);
  func(`}`);
  /* eslint-enable quotes */
  return func.toFunction({});
}

/* istanbul ignore next */
Transitionable.register('url', function decode_url(payload) { // eslint-disable-line camelcase
  /* istanbul ignore next */
  return resolveURL(payload[0]);
});

/* istanbul ignore next */
Transitionable.register('port', function decode_port(payload) { // eslint-disable-line camelcase
  return port(resolveURL(payload[0]));
});

/* istanbul ignore next */
Transitionable.register('query', function decode_query(payload) { // eslint-disable-line camelcase
  return query(resolveURL(payload[0]));
});

/* istanbul ignore next */
Transitionable.register('mutation', function decode_mutation(payload) { // eslint-disable-line camelcase
  return mutation(resolveURL(payload[0]));
});

/* istanbul ignore next */
Transitionable.register('request_url', function decode_request_url(payload) { // eslint-disable-line camelcase
  return request(resolveURL(payload[0]));
});
