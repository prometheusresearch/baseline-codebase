/**
 * @flow
 */

import type {QueryPipeline, QueryAtom, Context} from '../model/types';
import type {Chart} from './model';

import {inferTypeAtPath, aggregate} from '../model/Query';
import {editor} from '../model/QueryOperation';
import {getNavigation} from '../model/QueryNavigation';
import {getUsedAttributes} from './model';

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

export function enrichQuery(query: QueryPipeline, chart: Chart): QueryPipeline {
  const focus = getQuery(query, null).query;
  if (focus == null) {
    return query;
  }
  let e = editor(query, focus);
  for (const attrName of getUsedAttributes(chart)) {
    let editAtCompletion;
    const type = inferTypeAtPath(focus.context.prev, [attrName]);
    if (type.card === 'seq' && type.name === 'record' && type.entity != null) {
      editAtCompletion = ensurePipelineHasCount;
    }
    e = e.growNavigation({path: [attrName], editAtCompletion});
  }
  return e.getQuery();
}

function ensurePipelineHasCount(pipe: QueryAtom[]): QueryAtom[] {
  const last = pipe[pipe.length - 1];
  if (last != null && last.name === 'aggregate') {
    return pipe;
  } else {
    return pipe.concat(aggregate('count'));
  }
}
