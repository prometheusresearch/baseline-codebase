/**
 * @copyright 2016, Prometheus Research, LLC
 */

import makeEnumerator from './makeEnumerator';
import immupdate from 'immupdate';

/**
 * Filter form value using a list of filters of the form:
 *
 *    [
 *      {
 *        keyPathPattern: 'key.path.*.pattern',
 *        hideIf: function(value, parentValue) { return // boolean },
 *
 *      },
 *      ...
 *
 *    ]
 */
export default function filterFormValue(value, filters) {
  if (!filters || filters.length === 0) {
    return value;
  }
  for (let i = 0; i < filters.length; i++) {
    let filter = filters[i];
    // TODO: move that to deserialization phase
    if (filter.keyPathPatternEnumerate === undefined) {
      filter.keyPathPatternEnumerate = makeEnumerator(filter.keyPathPattern);
    }
    let items = filter.keyPathPatternEnumerate(value);
    if (items.length === 0) {
      continue;
    }
    for (let j = 0; j < items.length; j++) {
      let item = items[j];
      if (filter.hideIf(item.value, item.parentValue)) {
        value = immupdate(value, item.keyPath.join('.'), undefined);
      }
    }
  }
  return value;
}
