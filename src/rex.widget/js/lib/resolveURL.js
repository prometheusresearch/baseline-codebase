/**
 * @copyright 2015, Prometheus Research, LLC
 */

import invariant from './invariant';

const ABSOLUTE_URL_RE = /^https?:\/\//;
const PACKAGE_ROUTE_RE = /^([a-zA-Z0-9_\.\-]+):(.+)$/;

/**
 * Resolve URL specification of shape package:/path to an absolute URL.
 */
export default function resolveURL(url) {
  if (!ABSOLUTE_URL_RE.exec(url) && typeof __MOUNT_POINTS__ !== 'undefined') {
    url = url.replace(PACKAGE_ROUTE_RE, resolvePackageMountPoint);
  }
  return url;
}

let _originalMountPoints = global.__MOUNT_POINTS__;

export function mockMountPoints(mountPoints) {
  _originalMountPoints = global.__MOUNT_POINTS__;
  global.__MOUNT_POINTS__ = mountPoints;
}

export function unmockMountPoints() {
  global.__MOUNT_POINTS__ = _originalMountPoints;
}

function resolvePackageMountPoint(_, pkg, path) {
  let mountPoint = __MOUNT_POINTS__[pkg];
  invariant(
    mountPoint !== undefined,
    'Unable to resolve mount point for package %s for URL %s',
    pkg, path
  );
  return mountPoint + path;
}
