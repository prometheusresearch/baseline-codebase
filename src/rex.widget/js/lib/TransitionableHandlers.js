/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import generateFunction from 'generate-function';
import * as Transitionable from './Transitionable';
import {port, query, mutation, request} from './data';
import resolveURL from './resolveURL';

/* istanbul ignore next */
Transitionable.register('undefined', function decode_undefined() { // eslint-disable-line camelcase
  return undefined;
});

Transitionable.register('js-value', function decode_symbol(payload) { // eslint-disable-line camelcase
  const [pkgName, symbolName] = payload;
  const pkg = __require__(pkgName);
  if (pkg[symbolName] === undefined) {
    throw new Error(`Package "${pkgName}" doesn't have "${symbolName}" but application was configured to look for it.`);
  }
  const symbol = pkg[symbolName];
  return symbol;
});

/* istanbul ignore next */
Transitionable.register('widget', function decode_widget(payload) { // eslint-disable-line camelcase
  const [pkgName, symbolName, props] = payload;
  const pkg = __require__(pkgName);
  if (pkg[symbolName] === undefined) {
    throw new Error(`Package "${pkgName}" doesn't have "${symbolName}" but application was configured to look for it.`);
  }
  const type = pkg[symbolName];
  return React.createElement(type, props);
});

/* istanbul ignore next */
Transitionable.register('formfield', function decode_formfield(payload) { // eslint-disable-line camelcase
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
