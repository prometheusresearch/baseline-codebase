/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {stringify}  from 'qs';
import resolveURL   from './resolveURL';

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
export function fetch(url, query = null) {
  url = prepareURL(url, query);
  return window.fetch(url, OPTIONS)
    .then(failOnHTTPError)
    .then(parseJSONResponse);
}

export function post(url, query = null, data = null) {
  url = prepareURL(url, query);
  let options = {...OPTIONS, body: data, method: 'post'};
  return window.fetch(url, options)
    .then(failOnHTTPError)
    .then(parseJSONResponse);
}

function filterQuery(query) {
  let nextQuery = {};
  for (let key in query) {
    if (query.hasOwnProperty(key) && query[key] != null && query[key] != '') {
      nextQuery[key] = query[key];
    }
  }
  return nextQuery;
}

function prepareURL(url, query = null) {
  url = resolveURL(url);
  query = filterQuery(query);
  if (query, Object.keys(query).length > 0) {
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

