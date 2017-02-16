/**
 * @flow
 */

import invariant from 'invariant';
import * as Query from './Query';

export type QueryLoc<Q: Query.QueryAtom = Query.QueryAtom> = {
  +rootQuery: Query.QueryPipeline;
  +at: string;
  _query: ?Q;
  _path: ?QueryPath;
};

export type QueryPathItem =
  | {at: 'pipeline', index: number, query: Query.QueryPipeline}
  | {at: 'select', key: string, query: Query.SelectQuery}
  | {at: 'binding', query: Query.DefineQuery};

export type QueryPath = Array<QueryPathItem>;

export type ResolvedQueryLoc<Q: Query.QueryAtom = Query.QueryAtom> = [Q, QueryPath];


export function resolveLoc<Q: Query.QueryAtom>(loc: QueryLoc<Q>): Q {
  resolveLocImpl(loc);
  invariant(loc._query != null, 'Impossible');
  return loc._query;
}

export function tryResolveLoc<Q: Query.QueryAtom>(loc: QueryLoc<Q>): ?Q {
  try {
    resolveLocImpl(loc);
  } catch (_err) {
    return null;
  }
  return loc._query;
}

export function resolveLocPath<Q: Query.QueryAtom>(loc: QueryLoc<Q>): QueryPath {
  resolveLocImpl(loc);
  invariant(loc._path!= null, 'Impossible');
  return loc._path;
}

function resolveLocImpl<Q: Query.QueryAtom>(loc: QueryLoc<Q>) {
  if (loc._query == null || loc._path == null) {
    let res = resolveLocWithPath(loc);
    invariant(
      res != null,
      'Invalid query id: %s', loc.at
    );
    loc._query = res[0];
    loc._path = res[1];
  }
}

export function resolveLocWithPath<Q: Query.QueryAtom>(loc: QueryLoc<Q>): ?ResolvedQueryLoc<Q> {
  for (let [query, path] of traverseQuery(loc.rootQuery)) {
    if (query.id === loc.at) {
      return [((query: any): Q), path];
    }
  }
  return null;
}

export function loc<Q: Query.QueryAtom>(rootQuery: Query.QueryPipeline, query: Q): QueryLoc<Q> {
  return {
    rootQuery,
    _query: query,
    _path: null,
    at: query.id
  };
}

export function rebaseLoc<Q: Query.QueryAtom>(loc: QueryLoc<Q>, rootQuery: Query.QueryPipeline): QueryLoc<Q> {
  return {...loc, rootQuery};
}

export function* traverseLoc(loc: QueryLoc<>): Generator<Query.QueryAtom | Query.QueryPipeline, *, *> {
  yield resolveLoc(loc);
  let path = resolveLocPath(loc).reverse();
  for (let item of path) {
    yield item.query;
    if (item.at === 'pipeline') {
      for (let i = item.index - 1; i >= 0; i--) {
        yield item.query.pipeline[i];
      }
    }
  }
}

function* traverseQuery(
  query: Query.Query,
  path?: QueryPath = []
): Generator<ResolvedQueryLoc<>, void, void> {
  if (query.name === 'pipeline') {
    for (let index = 0; index < query.pipeline.length; index++) {
      yield* traverseQuery(query.pipeline[index], path.concat({at: 'pipeline', index, query}));
    }
  } else if (query.name === 'select') {
    for (let key in query.select) {
      if (query.select.hasOwnProperty(key)) {
        yield* traverseQuery(query.select[key], path.concat({at: 'select', key, query}));
      }
    }
  } else if (query.name === 'define') {
    yield* traverseQuery(query.binding.query, path.concat({at: 'binding', query}));
  }
  if (query.name !== 'pipeline') {
    yield [query, path];
  }
}

