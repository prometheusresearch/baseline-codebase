/**
 * @flow
 */

import type {QueryPipeline} from '../Query';

import * as t from '../Type';
import * as q from '../Query';

export default function reconcileNavigation(query: QueryPipeline): QueryPipeline {
  return reconcilePipeline(query);
}

function reconcilePipeline(query: QueryPipeline): QueryPipeline {

  query = q.inferQueryType(query.context.prev, query);

  let tail = query.pipeline[query.pipeline.length - 1];

  if (tail.name === 'select') {
    let select = reconcileSelect(tail);
    let pipeline = query.pipeline;
    pipeline.pop();
    if (Object.keys(select.select).length > 0) {
      pipeline = pipeline.concat(select);
    }
    return q.inferQueryType(query.context.prev, {
      name: 'pipeline',
      context: query.context,
      pipeline
    });
  } else {
    let select = q.select({});
    select = q.inferQueryType(tail.context, select);
    select = reconcileSelect(select, true);
    let pipeline = query.pipeline;
    if (Object.keys(select.select).length > 0) {
      pipeline = pipeline.concat(select);
    }
    return q.inferQueryType(query.context.prev, {
      name: 'pipeline',
      context: query.context,
      pipeline: pipeline,
    });
  }

}

function reconcileSelect(query: q.SelectQuery, grow?: boolean): q.SelectQuery {
  let {inputType: type, domain} = query.context;

  type = t.maybeAtom(type);

   if (type == null) {
    return query;
  }

  let select = {};

  if (type.name === 'entity') {

    if (grow) {
      let attribute = domain.entity[type.entity].attribute;

      for (let k in attribute) {

        if (!attribute.hasOwnProperty(k)) {
          continue;
        }
        let type = attribute[k].type;
        let baseType = t.atom(type);
        if (type.name === 'seq') {
          continue;
        }
        if (baseType.name === 'entity') {
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
  }

  for (let k in query.select) {
    if (!query.select.hasOwnProperty(k)) {
      continue;
    }
    let pipeline = query.select[k];
    let kQuery = reconcilePipeline(pipeline);
    if (
      kQuery.context.type != null ||
      ((k in query.context.scope) && isInitialDefine(query.context.scope[k]))
    ) {
      select[k] = kQuery;
    }
  }

  // TODO: grow from scope
  return q.inferQueryType(query.context.prev, q.select({...select}));
}

function isInitialDefine(query: QueryPipeline) {
  return (
    query.pipeline.length === 1 &&
    query.pipeline[0].name === 'navigate' &&
    query.pipeline[0].path === ''
  );
}
