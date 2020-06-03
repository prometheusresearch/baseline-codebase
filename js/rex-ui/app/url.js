// @flow

import invariant from "invariant";

let ABSOLUTE_URL_RE = /^https?:\/\//;
let PACKAGE_ROUTE_RE = /^([a-zA-Z0-9_.-]+):(.+)$/;

/**
 * Resolve URL specification of shape package:/path to an absolute URL.
 */
export function urlFor(url: string) {
  if (
    !ABSOLUTE_URL_RE.exec(url) &&
    typeof global.__MOUNT_POINTS__ !== "undefined"
  ) {
    url = url.replace(PACKAGE_ROUTE_RE, resolvePackageMountPoint);
  }
  return url;
}

function resolvePackageMountPoint(_, pkg, path) {
  let mountPoint = global.__MOUNT_POINTS__[pkg];
  invariant(
    mountPoint !== undefined,
    "Unable to resolve mount point for package %s for URL %s",
    pkg,
    path,
  );
  return mountPoint + path;
}

let _originalMountPoints = global.__MOUNT_POINTS__;

export function mockMountPoints(mountPoints: Object) {
  _originalMountPoints = global.__MOUNT_POINTS__;
  global.__MOUNT_POINTS__ = mountPoints;
}

export function unmockMountPoints() {
  global.__MOUNT_POINTS__ = _originalMountPoints;
}
