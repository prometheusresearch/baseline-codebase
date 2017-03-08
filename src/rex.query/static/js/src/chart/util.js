/**
 * @flow
 */

import {getNavigation} from '../model/QueryNavigation';
import {type QueryPipeline, type Context} from '../model';

export function getColumnOptions(
  context: Context,
): Array<{label: string, value: string}> {
  const nav = getNavigation(context);
  return Array.from(nav.values()).map(nav => ({
    label: nav.label,
    value: nav.value,
  }));
}

export function getQuery(
  query: QueryPipeline,
  data: any,
): {query: ?QueryPipeline, data: any} {
  if (query.pipeline.length === 1) {
    return {query: null, data};
  } else {
    if (query.pipeline[1].name === 'define') {
      if (data != null) {
        data = data[Object.keys(data)[0]];
      }
      return {query: query.pipeline[1].binding.query, data};
    } else {
      return {query: null, data};
    }
  }
}
