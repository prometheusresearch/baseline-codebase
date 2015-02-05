/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

function groupBy(items, keyFunc) {
  var result = [];
  var key;
  var group;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var itemKey = keyFunc(item);
    if (itemKey !== key) {
      key = itemKey;
      group = [];
      result.push({key, group});
    }
    group.push(item);
  }
  return result;
}

module.exports = groupBy;
