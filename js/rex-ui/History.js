/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {
  createHashHistory,
  createBrowserHistory,
  type HashHistory,
  type BrowserHistory,
  type Location,
  type Action,
  createLocation
} from "history";

export type { Location, Action };

let _browserHistory: ?BrowserHistory;
let _hashHistory: ?HashHistory = null;

export function getHashHistory(): HashHistory {
  if (_hashHistory == null) {
    _hashHistory = createHashHistory({
      hashType: "noslash"
    });
  }
  return _hashHistory;
}

export function getBrowserHistory(): BrowserHistory {
  if (_browserHistory == null) {
    _browserHistory = createBrowserHistory({});
  }
  return _browserHistory;
}

export function getCurrentLocation(): Location {
  return createLocation(window.location.hash.slice(1));
}

export opaque type PreventReason = {|
  message: string,
  allow: () => void
|};

export function preventNavigation(message: string): PreventReason {
  let allowHash = getHashHistory().block(message);
  let allowBrowser = getBrowserHistory().block(message);
  let reason = {
    message,
    allow: () => {
      allowHash();
      allowBrowser();
    }
  };
  REASONS.push(reason);
  if (REASONS.length === 1) {
    window.addEventListener(BEFOREUNLOAD_EVENT, onBeforeUnload);
  }
  return reason;
}

export function allowNavigation(reason: null | PreventReason) {
  if (reason == null) {
    return;
  }
  let idx = REASONS.indexOf(reason);
  if (idx > -1) {
    reason.allow();
    REASONS.splice(idx, 1);
    if (REASONS.length === 0) {
      window.removeEventListener(BEFOREUNLOAD_EVENT, onBeforeUnload);
    }
  }
}

export function confirmNavigation() {
  let reason = getReason();
  if (reason === null) {
    return true;
  } else {
    return window.confirm(reason.message);
  }
}

const REASONS: PreventReason[] = [];

const BEFOREUNLOAD_EVENT = "beforeunload";

function getReason() {
  return REASONS.length === 0 ? null : REASONS[REASONS.length - 1];
}

function onBeforeUnload(e) {
  let reason = getReason();
  if (reason !== null) {
    e.returnValue = reason.message;
    return reason;
  }
}
