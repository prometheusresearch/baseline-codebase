/**
 * @copyright 2020, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";

const ABSOLUTE_URL_RE = /^https?:\/\//;
const PACKAGE_ROUTE_RE = /^([a-zA-Z0-9_.-]+):(.+)$/;

/**
 * Resolve URL specification of shape package:/path to an absolute URL.
 */
function resolveURL(url) {
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

/**
 * Upload `file` to `url`.
 *
 * Returns a promise and accepts an optional `onProgress` callback.
 */
/* istanbul ignore next */
export default function upload(
  url: string,
  file: File,
  onProgress?: number => void,
): Promise<{ file: string }> {
  url = resolveURL(url);
  return new Promise(function(resolve, reject) {
    let data = new FormData();
    data.append("file", file);
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.onload = response =>
      resolve(JSON.parse((response.target: any).responseText));
    xhr.onerror = reject;
    if (onProgress != null) {
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          let progress = e.loaded / e.total;
          if (onProgress != null) {
            onProgress(progress);
          }
        }
      };
    }
    try {
      xhr.send(data);
    } catch (err) {
      reject(err);
    }
  });
}
