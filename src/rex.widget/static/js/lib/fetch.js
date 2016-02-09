/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {stringify} from 'qs';
import resolveURL from './resolveURL';
import * as Transitionable from './Transitionable';

const OPTIONS = {
  credentials: 'same-origin',
  headers: {
    'Accept': 'application/json'
  }
};

/**
 * Fetch resource.
 *
 * @param {String} url
 * @param {Object} query
 */
export function fetch(url, query = null, options = {}) {
  url = prepareURL(url, query);
  let promise = global.fetch(url, OPTIONS)
    .then(failOnHTTPError);
  if (options.useTransit) {
    promise = promise.then(parseTransitResponse);
  } else {
    promise = promise.then(parseJSONResponse);
  }
  return promise;
}

export function post(url, query = null, data = null, options = {}) {
  url = prepareURL(url, query);
  let fetchParams = {...OPTIONS, body: data, method: 'post'};
  let promise = global.fetch(url, fetchParams)
    .then(failOnHTTPError);
  if (options.useTransit) {
    promise = promise.then(parseTransitResponse);
  } else {
    promise = promise.then(parseJSONResponse);
  }
  return promise;
}

function filterQuery(query) {
  let nextQuery = {};
  for (let key in query) {
    if (query.hasOwnProperty(key) && query[key] != null && query[key] !== '') {
      nextQuery[key] = query[key];
    }
  }
  return nextQuery;
}

function prepareURL(url, query = null) {
  url = resolveURL(url);
  query = filterQuery(query);
  if (query && Object.keys(query).length > 0) {
    if (url.indexOf('?') === -1) {
      url = `${url}?${stringify(query, {indices: false})}`;
    } else {
      url = `${url}&${stringify(query, {indices: false})}`;
    }
  }
  return url;
}

function failOnHTTPError(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    let error = new Error(response.statusText);
    error.response = response
    throw error;
  }
}

function parseJSONResponse(response) {
  return response.json();
}

function parseTransitResponse(response) {
  return response.text().then(data => Transitionable.decode(data));
}
