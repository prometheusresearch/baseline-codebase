/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */

'use strict';


// Merges N number of objects/dictionaries into a single object.
function merge(dest) {
  dest = {...dest};

  for (let i = 1; i < arguments.length; i++) {
    let source = arguments[i];

    for (let key in source) {
      if (source.hasOwnProperty(key)) {
        if ((typeof dest[key] === 'object') && (typeof source[key] === 'object')) {
          // From & To are Objects, recursively merge them.
          dest[key] = merge(dest[key], source[key]);

        } else if (Array.isArray(dest[key]) && Array.isArray(source[key])) {
          // From & To are Arrays, add missing values.
          source[key].forEach((value) => {
            if (dest[key].indexOf(value) === -1) {
              dest[key].push(value);
            }
          });

        } else {
          // Otherwise, copy over the dest.
          dest[key] = source[key];

        }
      }
    }
  }

  return dest;
}


module.exports = merge;

