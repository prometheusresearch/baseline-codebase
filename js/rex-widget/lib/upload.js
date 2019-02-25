/**
 * @copyright 2016, Prometheus Research, LLC
 */

import resolveURL from './resolveURL';

/**
 * Upload `file` to `url`.
 *
 * Returns a promise and accepts an optional `onProgress` callback.
 */
/* istanbul ignore next */
export default function upload(url, file, onProgress = null) {
  url = resolveURL(url);
  return new Promise(function(resolve, reject) {
    let data = new FormData();
    data.append('file', file);
    let xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onload = resolve;
    xhr.onerror = reject;
    if (onProgress) {
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          let progress = e.loaded / e.total;
          onProgress(progress);
        }
      };
    }
    try {
      xhr.send(data);
    } catch(err) {
      reject(err);
    }
  });
}

