/**
 * @jsx React.DOM
 */

import {flatten} from 'flat';
import qs        from 'dot-qs';

export {parse}   from 'dot-qs';

export function stringify(obj, options = {}) {
  obj = flatten(obj);
  if (!options.plain) {
    for (let k in obj) {
      if (!obj.hasOwnProperty(k)) {
        continue;
      }
      if (obj[k] === null || obj[k] === undefined || obj[k] === '') {
        delete obj[k];
      }
    }
  }
  let result = qs.stringify(obj).replace(/%2F/g, '/');
  if (options.plain) {
    result = result.replace(/\.[0-9]+=/g, '=');
  }
  return result;
}
