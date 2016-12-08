/**
 * @flow
 */

import type {ColumnConfig, ColumnSpec} from './DataTable';

/**
 * Get a list of column specs from a column config.
 *
 * This allows to determine what columns will be rendered in a datatable
 * ignoring their grouping and stacking.
 */
export default function getColumnSpecList(
  config: ColumnConfig<*>
): Array<ColumnSpec<*>> {
  let queue = [config];
  let columnList = [];
  while (queue.length > 0) {
    let c = queue.shift();
    if (c.type === 'field') {
      columnList.push(c.field);
    } else if (c.type === 'stack') {
      if (c.columnList.length > 0) {
        queue.unshift(c.columnList[c.columnList.length - 1]);
      }
    } else if (c.type === 'group') {
      queue = c.columnList.concat(queue);
    }
  }
  return columnList;
}
