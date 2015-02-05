/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

function sortBy(items, keyFunc) {
  items = items.slice(0);
  items.sort(function(a, b) {
    var aKey = keyFunc(a);
    var bKey = keyFunc(b);
    if (aKey > bKey) {
      return 1;
    }
    if (aKey < bKey) {
      return -1;
    }
    return 0;
  });
  return items;
}

module.exports = sortBy;
