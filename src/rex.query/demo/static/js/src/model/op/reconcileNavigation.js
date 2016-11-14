/**
 * @flow
 */

import type {QueryPipeline} from '../Query';

import * as t from '../Type';
import * as q from '../Query';

/**
 * This function automatically grows select combinators at the leaves so that
 * data is visible in the output.
 */
export default function reconcileNavigation(query: QueryPipeline): QueryPipeline {
  return reconcilePipeline(query);
}

function reconcilePipeline(query: QueryPipeline): QueryPipeline {

  query = q.inferQueryType(query.context.prev, query);

  let tail = query.pipeline[query.pipeline.length - 1];

  let pipeline = [];

  for (let i = 0; i < query.pipeline.length; i++) {
    let item = query.pipeline[i];
    if (item.name === 'define') {
      item = reconcileDefine(item);
    }
    if (item === tail && tail.name === 'select') {
      continue;
    }
    pipeline.push(item);
  }

  let select = tail.name === 'select'
    ? reconcileSelect(tail)
    : reconcileSelect(q.inferQueryType(tail.context, q.select({})), true);

  if (Object.keys(select.select).length > 0) {
    pipeline = pipeline.concat(select);
  }

  return q.inferQueryType(query.context.prev, {
    name: 'pipeline',
    context: query.context,
    pipeline: pipeline,
  });
}

function reconcileDefine(query: q.DefineQuery): q.DefineQuery {
  let binding = {
    name: query.binding.name,
    query: reconcilePipeline(query.binding.query),
  };
  return {
    name: 'define',
    binding,
    context: query.context,
  };
}

function reconcileSelect(query: q.SelectQuery, grow?: boolean): q.SelectQuery {
  let {prev: {type}} = query.context;

  type = t.maybeAtom(type);

   if (type == null) {
    return query;
  }

  let select = {};

  if (grow && type.name === 'record') {
    let attribute = t.recordAttribute(type);

    for (let k in attribute) {

      if (!attribute.hasOwnProperty(k)) {
        continue;
      }

      let type = attribute[k].type;

      if (type.name === 'seq') {
        continue;
      }

      if (k in query.select) {
        let pipeline = query.select[k];
        select[k] = reconcilePipeline(pipeline);
      } else {
        let pipeline = q.pipeline(q.navigate(k));
        pipeline = q.inferQueryType(query.context, pipeline);
        select[k] = reconcilePipeline(pipeline);
      }
    }
  }

  // filter out invalid types from select
  for (let k in query.select) {
    if (!query.select.hasOwnProperty(k)) {
      continue;
    }
    let kQuery = query.select[k];
    if (kQuery.context.type != null) {
      select[k] = kQuery;
    }
  }

  // force group by columns always visible
  let groupByColumnList = getGroupByColumnList(type);
  if (groupByColumnList.length > 0) {
    let nextSelect = {}
    groupByColumnList.forEach(val => {
      if (select[val] == null) {
        nextSelect[val] = q.pipeline(q.navigate(val));
      }
    });
    Object.assign(nextSelect, select);
    select = nextSelect;
  }

  return q.inferQueryType(query.context.prev, q.select({...select}));
}

function getGroupByColumnList(type): Array<string> {
  if (type.name !== 'record') {
    return [];
  }
  let columnList = [];
  let attribute = t.recordAttribute(type);

  for (let k in attribute) {
    if (!attribute.hasOwnProperty(k)) {
      continue;
    }
    if (!attribute[k].groupBy) {
      continue;
    }
    columnList.push(k);
  }
  return columnList;
}
