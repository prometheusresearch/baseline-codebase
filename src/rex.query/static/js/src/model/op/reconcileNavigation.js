/**
 * @flow
 */

import type {QueryPipeline} from '../Query';

import * as t from '../Type';
import * as q from '../Query';

const INITIAL_COLUMN_NUM_LIMIT = 5;
const INITIAL_COLUMN_PRIORITY_NAME_LIST: Array<string> = [
  'id',
  'key',
  'name',
  'title',
  'type',
];


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
    ? reconcileSelect(tail.context.prev, tail)
    : reconcileSelect(tail.context, null);

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

function reconcileSelect(context: q.Context, query: ?q.SelectQuery): q.SelectQuery {
  let {type} = context;

  if (type.name === 'invalid') {
    return query != null ? query : q.select({});
  }

  let select = {};

  if (query != null) {
    // filter out invalid types from select
    const prevSelect = query.select;
    for (let k in prevSelect) {
      if (!prevSelect.hasOwnProperty(k)) {
        continue;
      }
      let kQuery = prevSelect[k];
      if (kQuery.context.type.name !== 'invalid') {
        select[k] = kQuery;
      }
    }
  } else {
    if (type.name === 'record') {
      let length = 0;
      let attribute = t.recordAttribute(type);
      // try to add common columns first
      for (let i = 0; i < INITIAL_COLUMN_PRIORITY_NAME_LIST.length; i++) {
        if (length >= INITIAL_COLUMN_NUM_LIMIT) {
          break;
        }
        let k = INITIAL_COLUMN_PRIORITY_NAME_LIST[i];
        if (maybeAddToSelect(select, context, k, attribute[k])) {
          length += 1;
        }
      }
      for (let k in attribute) {
        if (length >= INITIAL_COLUMN_NUM_LIMIT) {
          break;
        }
        if (!attribute.hasOwnProperty(k)) {
          continue;
        }
        if (select[k] != null) {
          continue;
        }
        if (maybeAddToSelect(select, context, k, attribute[k])) {
          length += 1;
        }
      }
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

  return q.inferQueryType(context, q.select({...select}));
}

function maybeAddToSelect(select, context, key, attribute) {
  if (attribute == null) {
    return false;
  }
  let type = attribute.type;
  if (type.card === 'seq') {
    return false;
  }
  let pipeline = q.pipeline(q.navigate(key));
  select[key] = q.inferQueryType(context, pipeline);
  return true;
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
