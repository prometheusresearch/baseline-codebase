/**
 * @flow
 */

import type {ColumnConfig, ColumnField} from './DataTable';

/**
 * Get a list of column fields from a column config.
 *
 * This allows to determine what columns will be rendered in a datatable
 * ignoring their grouping and stacking.
 */
export default function getColumnSpecList<T>(
  config: ColumnConfig<T>,
): Array<ColumnField<T>> {
  let queue = [config];
  let columnFieldList = [];
  while (queue.length > 0) {
    let c = queue.shift();
    if (c.type === 'field') {
      columnFieldList.push(c);
    } else if (c.type === 'stack') {
      if (c.columnList.length > 0) {
        queue.unshift(c.columnList[c.columnList.length - 1]);
      }
    } else if (c.type === 'group') {
      queue = c.columnList.concat(queue);
    }
  }
  return columnFieldList;
}
