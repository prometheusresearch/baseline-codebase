/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import resolveURL from "./resolveURL";

/**
 * Upload `file` to `url`.
 *
 * Returns a promise and accepts an optional `onProgress` callback.
 */
/* istanbul ignore next */
export default function upload(
  url: string,
  file: File,
  onProgress?: number => void
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
