/**
 * @copyright 2015, Prometheus Research, LLC
 */

import resolveURL   from './resolveURL';
import {stringify}  from './qs';

/**
 * Wrapper on top of WHATWG Fetch to error on HTTP error and return JSON
 * payload.
 */
export default function fetchJSON(url, params = null) {
  url = resolveURL(url);
  if (params) {
    url = `${url}?${stringify(params)}`;
  }
  let options = {
    headers: {
      'Accept': 'application/json'
    }
  };
  return window.fetch(url, options)
    .then(failOnHTTPError)
    .then(parseJSONResponse);
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
