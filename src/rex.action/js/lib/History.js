/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type {History, Location, Action} from 'history';
import {createLocation} from 'history/LocationUtils';
import createHashHistory from 'history/createHashHistory';

export type {History, Location, Action};

let _history: ?History = null;

/**
 * Get an instance of History API.
 */
export function getHistory(): History {
  if (_history == null) {
    _history = createHashHistory({
      hashType: 'noslash',
    });
  }
  return _history;
}

export function getCurrentLocation(): Location {
  return createLocation(window.location.hash.slice(1));
}
