/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import {stringify} from 'qs';
import resolveURL from './resolveURL';
import * as Transitionable from './Transitionable';

export type Headers = {[key: string]: string};

const DEFAULT_HEADERS: Headers = {
  Accept: 'application/json',
};

const FETCH_OPTIONS = {
  credentials: 'same-origin',
  headers: DEFAULT_HEADERS,
};

type FetchOptions = {|
  method?: 'post' | 'get' | 'delete' | 'put',
  jsonifyData?: boolean,
  useTransit?: boolean,
  headers?: Headers,
  skipResponseParsing?: boolean,
|};

export type FetchParams = {
  [key: string]: string,
};

export type FetchData = mixed;

const noOptionsProvided: FetchOptions = ({}: any);

function updateFetchOptions(
  options: FetchOptions,
  update: $Shape<FetchOptions>,
): FetchOptions {
  return ({
    ...options,
    ...update,
    headers: {...options.headers, ...update.headers},
  }: any);
}

/**
 * Fetch resource.
 *
 * @param {String} url
 * @param {Object} query
 */
export function fetch(
  url: string,
  query: ?FetchParams = null,
  options: FetchOptions = noOptionsProvided,
) {
  url = prepareURL(url, query);
  const fetchOptions = {
    ...FETCH_OPTIONS,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
  };
  let promise = global.fetch(url, fetchOptions).then(failOnHTTPError);
  if (options.useTransit) {
    promise = promise.then(parseTransitResponse);
  } else {
    promise = promise.then(parseJSONResponse);
  }
  return promise;
}

export function post(
  url: string,
  query: ?FetchParams = null,
  data: ?FetchData = null,
  options?: FetchOptions = noOptionsProvided,
) {
  let opts = updateFetchOptions(options, {method: 'post'});
  return fetchData(url, query, data, opts);
}

export function put(
  url: string,
  query: ?FetchParams = null,
  data: ?FetchData = null,
  options?: FetchOptions = noOptionsProvided,
) {
  const opts = updateFetchOptions(options, {method: 'put'});
  return fetchData(url, query, data, opts);
}

export function del(
  url: string,
  query: ?FetchParams = null,
  data: ?FetchData = null,
  options?: FetchOptions = noOptionsProvided,
) {
  const opts = updateFetchOptions(options, {
    method: 'delete',
    skipResponseParsing:
      options.skipResponseParsing === undefined ? true : options.skipResponseParsing,
  });
  return fetchData(url, query, data, opts);
}

function fetchData(url, query = null, data = null, options: FetchOptions) {
  url = prepareURL(url, query);

  let fetchParams = {
    ...FETCH_OPTIONS,
    body: data,
    method: options.method || 'post',
    headers: {
      ...FETCH_OPTIONS.headers,
      ...options.headers,
    },
  };

  if (data && options.jsonifyData) {
    fetchParams.body = JSON.stringify(data);
    fetchParams.headers['Content-Type'] = 'application/json';
  }

  let promise = global.fetch(url, fetchParams).then(failOnHTTPError);

  if (!options.skipResponseParsing) {
    if (options.useTransit) {
      promise = promise.then(parseTransitResponse);
    } else {
      promise = promise.then(parseJSONResponse);
    }
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
    // $FlowFixMe: TODO: We need a custom `Error` subclass here.
    error.response = response;
    throw error;
  }
}

function parseJSONResponse(response) {
  return response.json();
}

function parseTransitResponse(response) {
  return response.text().then(data => Transitionable.decode(data));
}
