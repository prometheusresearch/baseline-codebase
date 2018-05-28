/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

export function getNavigator(): ?Navigator {
  if (typeof navigator === 'undefined') {
    return null;
  } else {
    return navigator;
  }
}

export function isFirefox(): boolean {
  const navigator = getNavigator();
  return Boolean(navigator && navigator.userAgent.search('Firefox') > -1);
}
