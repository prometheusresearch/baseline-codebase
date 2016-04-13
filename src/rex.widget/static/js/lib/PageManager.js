/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import Emitter from 'component-emitter';

const PAGE_CHANGE = 'page-change';
const _emitter = new Emitter();

function getHrefFromWindowLocation({protocol, host, pathname}) {
  return `${protocol}//${host}${pathname}`;
}

let _location = {
  href: getHrefFromWindowLocation(window.location),
};

export function subscribeLocationChange(listener) {
  _emitter.on(PAGE_CHANGE, listener);
}

export function unsubscribeLocationChange(listener) {
  _emitter.off(PAGE_CHANGE, listener);
}

export function getLocation() {
  return {..._location};
}

export function updateLocation(location) {
  history.pushState([], '', location.href);
  _location = location;
  _emitter.emit(PAGE_CHANGE, {...location});
}
