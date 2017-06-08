/**
 * @flow
 */

import invariant from 'invariant';
import createLogger from 'debug';

import type {
  Context,
  QueryAtom,
  QueryPipeline,
  SelectQuery,
  DefineQuery,
  QueryLoc,
  QueryPath,
} from './types';

import {navigate, select, pipeline, here, inferType, inferQueryType} from './Query';
import * as QL from './QueryLoc';
import * as t from './Type';

let log = createLogger('rex-query:op');

class Editor<Q: QueryAtom> {
  loc: QueryLoc<Q>;

  constructor(loc: QueryLoc<Q>) {
    this.loc = loc;
  }

  setLoc<NQ: QueryAtom>(nextQuery: NQ): Editor<NQ> {
    let nextLoc = QL.loc(this.loc.rootQuery, nextQuery);
    return new Editor(nextLoc);
  }

  insertAfter(params: {what: Array<QueryAtom>}): Editor<Q> {
    let nextQuery = insertAfter({loc: this.loc, what: params.what});
    let nextLoc = QL.rebaseLoc(this.loc, nextQuery);
    return new Editor(nextLoc);
  }

  transformWith<NQ: QueryAtom>(f: Q => NQ): Editor<NQ> {
    let nextQuery = edit(this.loc, f);
    invariant(nextQuery != null, 'Invalid query transform');
    let nextLoc: QueryLoc<NQ> = (QL.rebaseLoc(this.loc, nextQuery): any);
    return new Editor(nextLoc);
  }

  replaceWith<NQ: QueryAtom>(q: NQ): Editor<NQ> {
    let nextQuery = edit(this.loc, _ => q);
    invariant(nextQuery != null, 'Invalid query replace');
    let nextLoc: QueryLoc<NQ> = (QL.rebaseLoc(this.loc, nextQuery): any);
    return new Editor(nextLoc);
  }

  transformPipelineWith(f: (Array<QueryAtom>) => Array<QueryAtom>): Editor<Q> {
    let nextQuery = editPipeline(this.loc, f);
    invariant(nextQuery != null, 'Invalid query transform');
    let nextLoc = QL.rebaseLoc(this.loc, nextQuery);
    return new Editor(nextLoc);
  }

  cut(): Editor<Q> {
    log('cut:begin', this.loc);
    let nextQuery = cut({loc: this.loc});
    if (nextQuery == null) {
      nextQuery = pipeline(here);
    }
    let nextLoc = QL.rebaseLoc(this.loc, nextQuery);
    log('cut:end', nextLoc);
    return new Editor(nextLoc);
  }

  remove(): Editor<Q> {
    log('remove:begin', this.loc);
    let nextQuery = remove({loc: this.loc});
    if (nextQuery == null) {
      nextQuery = pipeline(here);
    }
    let nextLoc = QL.rebaseLoc(this.loc, nextQuery);
    log('remove:end', nextLoc);
    return new Editor(nextLoc);
  }

  removeSelect(): Editor<Q> {
    let nextQuery = editPipeline(this.loc, pipeline => {
      let last = pipeline[pipeline.length - 1];
      if (last && last.name === 'select') {
        pipeline = pipeline.slice(0, pipeline.length - 1);
      }
      return pipeline;
    });
    if (nextQuery == null) {
      nextQuery = pipeline(here);
    }
    let nextLoc = QL.rebaseLoc(this.loc, nextQuery);
    return new Editor(nextLoc);
  }

  inferType(): Editor<Q> {
    let query = this.loc.rootQuery;
    let nextQuery = inferType(query.context.domain, query);
    let nextLoc = QL.rebaseLoc(this.loc, nextQuery);
    return new Editor(nextLoc);
  }

  growNavigation(params: {
    path: Array<string>,
    editAtCompletion?: (Array<QueryAtom>) => Array<QueryAtom>,
  }): Editor<Q> {
    let nextQuery = growNavigation({
      loc: this.loc,
      path: params.path,
      editAtCompletion: params.editAtCompletion,
    });
    let nextLoc = QL.rebaseLoc(this.loc, nextQuery);
    return new Editor(nextLoc);
  }

  getQuery(): QueryPipeline {
    let query = this.loc.rootQuery;
    query = inferType(query.context.domain, query);
    query = reconcileNavigation(query);
    query = inferType(query.context.domain, query);
    return query;
  }
}

export function editor(
  rootQuery: QueryPipeline,
  query: QueryPipeline | QueryAtom,
  config?: {edge: 'leading' | 'trailing'} = {edge: 'trailing'},
): Editor<*> {
  if (query.name === 'pipeline') {
    query = getInsertionPoint(query, config.edge);
  }
  return new Editor(QL.loc(rootQuery, query));
}

function transformQueryByPath(
  query: ?QueryAtom | QueryPipeline,
  path: QueryPath,
): ?QueryPipeline {
  let cur: ?QueryAtom | QueryPipeline = query;
  for (let i = path.length - 1; i >= 0; i--) {
    let item = path[i];

    if (item.at === 'pipeline') {
      let pipeline = item.query.pipeline.slice(0);
      if (cur == null) {
        pipeline.splice(item.index, 1);
        if (pipeline.length === 0) {
          cur = null;
          continue;
        }
      } else {
        invariant(cur != null && cur.name !== 'pipeline', 'Invalid query structure');
        pipeline[item.index] = cur;
      }
      // This is needed so we don't leave orphaned select combinators in
      // pipeline. We need to refactor pipeline query to exclude select
      // combinators from pipeline and make them implicit. That way we don't
      // need to take that into accoint in many places.
      if (pipeline.length === 1 && pipeline[0].name === 'select') {
        cur = null;
        continue;
      }
      cur = {
        name: 'pipeline',
        ...item.query,
        pipeline,
      };
    } else if (item.at === 'select') {
      let select = {...item.query.select};
      if (cur == null) {
        delete select[item.key];
        if (Object.keys(select).length === 0) {
          cur = null;
          continue;
        }
      } else {
        select[item.key] = cur;
      }
      cur = {
        name: 'select',
        ...item.query,
        select,
      };
    } else if (item.at === 'binding') {
      if (cur == null) {
        continue;
      }
      invariant(cur != null && cur.name === 'pipeline', 'Invalid query structure');
      cur = {
        name: 'define',
        ...item.query,
        binding: {
          ...item.query.binding,
          query: cur,
        },
      };
    }
  }
  invariant(
    cur == null || cur.name === 'pipeline',
    'Expected a query pipeline (or null) but got: "%s"',
    cur != null ? cur.name : cur,
  );
  return cur;
}

function edit<Q: QueryAtom>(loc: QueryLoc<Q>, edit: Q => ?QueryAtom): ?QueryPipeline {
  let found = QL.resolveLocWithPath(loc);
  invariant(found != null, 'Cannot find query by id: %s', loc.at);
  let [query, path] = found;
  return transformQueryByPath(edit(query), path);
}

function editPipeline<Q: QueryAtom>(
  loc: QueryLoc<Q>,
  edit: (Array<QueryAtom>) => Array<QueryAtom>,
): ?QueryPipeline {
  let found = QL.resolveLocWithPath(loc);
  invariant(found != null, 'Cannot find query by id: %s', loc.at);
  let [query, path] = found;
  if (query.name === 'pipeline') {
    let pipeline = edit(query.pipeline);
    if (pipeline.length === 0) {
      return transformQueryByPath(null, path);
    } else {
      query = {
        ...query,
        pipeline: edit(query.pipeline),
      };
      return transformQueryByPath(query, path);
    }
  } else if (path.length > 0) {
    const pathItem = path.pop();
    invariant(pathItem.at === 'pipeline', 'Invalid query structure');
    const pipeline = edit(pathItem.query.pipeline);
    if (pipeline.length === 0) {
      return transformQueryByPath(null, path);
    } else {
      query = {
        name: 'pipeline',
        id: pathItem.query.id,
        context: pathItem.query.context,
        pipeline,
      };
      return transformQueryByPath(query, path);
    }
  } else {
    invariant(false, 'Invalid query structure');
  }
}

export function remove<Q: QueryAtom>({loc}: {loc: QueryLoc<Q>}) {
  return editPipeline(loc, pipeline => {
    const idx = pipeline.findIndex(q => q.id === loc.at);
    if (idx === -1) {
      return pipeline;
    }
    const nextPipeline = pipeline.slice(0);
    nextPipeline.splice(idx, 1);
    // try to restore the latest saved select if needed
    const last = nextPipeline[nextPipeline.length - 1];
    if (
      idx === pipeline.length - 1 &&
      last &&
      last.name !== 'select' &&
      last.savedSelect != null
    ) {
      nextPipeline.push(last.savedSelect);
    }
    return nextPipeline;
  });
}

export function cut<Q: QueryAtom>({loc}: {loc: QueryLoc<Q>}): ?QueryPipeline {
  let query = editPipeline(loc, pipeline => {
    let idx = pipeline.findIndex(q => q.id === loc.at);
    invariant(idx > -1, 'Invalid query location: %s', loc.at);
    pipeline = pipeline.slice(0, idx);
    // try to restore the latest saved select if needed
    const last = pipeline[pipeline.length - 1];
    if (last != null && last.savedSelect != null) {
      pipeline.push(last.savedSelect);
    }
    return pipeline;
  });
  return query;
}

export function insertAfter<Q: QueryAtom>({
  loc,
  what,
}: {
  loc: QueryLoc<Q>,
  what: Array<QueryAtom>,
}): QueryPipeline {
  let query = editPipeline(loc, pipeline => {
    let idx = pipeline.findIndex(q => q.id === loc.at);
    invariant(idx > -1, 'Invalid query location');
    pipeline = pipeline.slice(0);
    // check if we need to save the selection state
    const maybeSelect = pipeline[pipeline.length - 1];
    if (idx === pipeline.length - 2 && maybeSelect.name === 'select') {
      // $FlowIssue: not sure why I can't unify with QueryAtom here
      pipeline[idx] = {
        ...pipeline[idx],
        savedSelect: maybeSelect,
      };
    }
    pipeline.splice(idx + 1, 0, ...what);
    return pipeline;
  });
  invariant(query != null, 'Invalid operation');
  return query;
}

export function transform<Q: QueryAtom>({
  loc,
  transform,
}: {
  loc: QueryLoc<Q>,
  transform: Q => ?QueryAtom,
}): ?QueryPipeline {
  return edit(loc, transform);
}

export function growNavigation<Q: QueryAtom>({
  loc,
  path,
  editAtCompletion,
}: {
  loc: QueryLoc<Q>,
  path: Array<string>,
  editAtCompletion?: (Array<QueryAtom>) => Array<QueryAtom>,
}): QueryPipeline {
  let query = editPipeline(loc, pipeline => {
    const nextPipeline = growNavigationImpl(pipeline, path, editAtCompletion);
    return nextPipeline;
  });
  invariant(query != null, 'Invalid operation');
  return query;
}

function growNavigationImpl(
  pipe: Array<QueryAtom>,
  path: Array<string>,
  editAtCompletion?: (Array<QueryAtom>) => Array<QueryAtom>,
): Array<QueryAtom> {
  if (path.length === 0) {
    if (editAtCompletion != null) {
      pipe = editAtCompletion(pipe);
    }
    return pipe;
  }

  let [key, ...rest] = path;
  let tail = pipe[pipe.length - 1];

  if (tail.name === 'select') {
    let nextPipe = growNavigationImpl(
      tail.select[key] != null ? tail.select[key].pipeline : [navigate(key)],
      rest,
      editAtCompletion,
    );
    const nextSelect = {
      name: 'select',
      ...tail,
      select: {...tail.select, [key]: pipeline(...nextPipe)},
    };
    return pipe.slice(0, pipe.length - 1).concat(nextSelect);
  } else {
    let nextPipe = growNavigationImpl([navigate(key)], rest, editAtCompletion);
    return pipe.concat(select({[key]: pipeline(...nextPipe)}));
  }
}

export function getInsertionPoint(
  query: QueryPipeline,
  edge?: 'leading' | 'trailing' = 'trailing',
): QueryAtom {
  invariant(
    !(
      (query.pipeline.length === 1 && query.pipeline[0].name === 'select') ||
      query.pipeline.length === 0
    ),
    'Invalid query pipeline',
  );

  let item;
  if (edge === 'trailing') {
    item = query.pipeline[query.pipeline.length - 1];
    if (item.name === 'select') {
      item = query.pipeline[query.pipeline.length - 2];
    }
  } else {
    item = query.pipeline[0];
  }
  return item;
}

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
export function reconcileNavigation(query: QueryPipeline): QueryPipeline {
  return reconcilePipeline(query);
}

function reconcilePipeline(query: QueryPipeline): QueryPipeline {
  query = inferQueryType(query.context.prev, query);

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

  if (pipeline.length === 0) {
    pipeline = [here];
  }

  return inferQueryType(query.context.prev, {
    id: query.id,
    name: 'pipeline',
    context: query.context,
    pipeline: pipeline,
  });
}

function reconcileDefine(query: DefineQuery): DefineQuery {
  let binding = {
    name: query.binding.name,
    query: reconcilePipeline(query.binding.query),
  };
  return {
    name: 'define',
    ...query,
    binding,
  };
}

function reconcileSelect(context: Context, query: ?SelectQuery): SelectQuery {
  let {type} = context;

  if (type.name === 'invalid') {
    return query != null ? query : select({});
  }

  let fields = {};

  if (query != null) {
    // filter out invalid types from select
    const prevSelect = query.select;
    for (let k in prevSelect) {
      if (!prevSelect.hasOwnProperty(k)) {
        continue;
      }
      let kQuery = prevSelect[k];
      if (kQuery.context.type.name !== 'invalid') {
        fields[k] = kQuery;
      }
    }

    // Ok, all fields are invalid, let's build from scratch.
    if (Object.keys(fields).length === 0) {
      return reconcileSelect(context, null);
    }
  } else {
    if (t.isRecord(type)) {
      let length = 0;
      let attribute = t.recordLikeAttribute(type);
      // try to add common columns first
      for (let i = 0; i < INITIAL_COLUMN_PRIORITY_NAME_LIST.length; i++) {
        if (length >= INITIAL_COLUMN_NUM_LIMIT) {
          break;
        }
        let k = INITIAL_COLUMN_PRIORITY_NAME_LIST[i];
        if (maybeAddToSelect(fields, context, k, attribute[k])) {
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
        if (fields[k] != null) {
          continue;
        }
        if (maybeAddToSelect(fields, context, k, attribute[k])) {
          length += 1;
        }
      }
    }
  }

  // force group by columns always visible
  let groupByColumnList = getGroupByColumnList(type);
  if (groupByColumnList.length > 0) {
    let nextFields = {...fields};
    groupByColumnList.forEach(val => {
      if (nextFields[val] == null) {
        nextFields[val] = pipeline(navigate(val));
      }
    });
    fields = nextFields;
  }

  // check if sort is valid
  let sort = query != null ? query.sort : null;

  if (sort != null) {
    const {context: {type}} = inferQueryType(
      context,
      pipeline(...sort.navigatePath.map(p => navigate(p))),
    );
    if (type.name === 'invalid') {
      sort = null;
    }
  }

  return inferQueryType(
    context,
    query != null
      ? {name: 'select', ...query, sort, select: fields}
      : select({...fields}),
  );
}

function maybeAddToSelect(select, context, key, attribute) {
  if (attribute == null) {
    return false;
  }
  let type = attribute.type;
  if (type.card === 'seq') {
    return false;
  }
  select[key] = inferQueryType(context, pipeline(navigate(key)));
  return true;
}

function getGroupByColumnList(type): Array<string> {
  if (!t.isRecord(type)) {
    return [];
  }
  let columnList = [];
  let attribute = t.recordLikeAttribute(type);

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
