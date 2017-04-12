/**
 * @flow
 */

import type {
  Query,
  QueryPipeline,
  QueryAtom,
  QueryLoc,
  QueryPath,
  ResolvedQueryLoc,
} from './types';

import invariant from 'invariant';

export function resolveLoc<Q: QueryAtom>(loc: QueryLoc<Q>): Q {
  resolveLocImpl(loc);
  invariant(loc._query != null, 'Impossible');
  return loc._query;
}

export function tryResolveLoc<Q: QueryAtom>(loc: QueryLoc<Q>): ?Q {
  try {
    resolveLocImpl(loc);
  } catch (_err) {
    return null;
  }
  return loc._query;
}

export function resolveLocPath<Q: QueryAtom>(loc: QueryLoc<Q>): QueryPath {
  resolveLocImpl(loc);
  invariant(loc._path != null, 'Impossible');
  return loc._path;
}

function resolveLocImpl<Q: QueryAtom>(loc: QueryLoc<Q>) {
  if (loc._query == null || loc._path == null) {
    let res = resolveLocWithPath(loc);
    invariant(res != null, 'Invalid query id: %s', loc.at);
    loc._query = res[0];
    loc._path = res[1];
  }
}

export function resolveLocWithPath<Q: QueryAtom>(loc: QueryLoc<Q>): ?ResolvedQueryLoc<Q> {
  for (let [query, path] of traverseQuery(loc.rootQuery)) {
    if (query.id === loc.at) {
      return [((query: any): Q), path];
    }
  }
  return null;
}

export function loc<Q: QueryAtom>(rootQuery: QueryPipeline, query: Q): QueryLoc<Q> {
  return {
    rootQuery,
    _query: query,
    _path: null,
    at: query.id,
  };
}

export function rebaseLoc<Q: QueryAtom>(
  loc: QueryLoc<Q>,
  rootQuery: QueryPipeline,
): QueryLoc<Q> {
  return {...loc, rootQuery};
}

export function traverseLoc(loc: QueryLoc<>): Array<QueryAtom | QueryPipeline> {
  let result = [];
  result.push(resolveLoc(loc));
  let path = resolveLocPath(loc).reverse();
  for (let item of path) {
    result.push(item.query);
    if (item.at === 'pipeline') {
      for (let i = item.index - 1; i >= 0; i--) {
        result.push(item.query.pipeline[i]);
      }
    }
  }
  return result;
}

function traverseQuery(query: Query, path?: QueryPath = []): Array<ResolvedQueryLoc<>> {
  let result = [];
  if (query.name === 'pipeline') {
    for (let index = 0; index < query.pipeline.length; index++) {
      result = result.concat(
        traverseQuery(query.pipeline[index], path.concat({at: 'pipeline', index, query})),
      );
    }
  } else if (query.name === 'select') {
    for (let key in query.select) {
      if (query.select.hasOwnProperty(key)) {
        result = result.concat(
          traverseQuery(query.select[key], path.concat({at: 'select', key, query})),
        );
      }
    }
  } else if (query.name === 'define') {
    result = result.concat(
      traverseQuery(query.binding.query, path.concat({at: 'binding', query})),
    );
  }
  if (query.name !== 'pipeline') {
    result.push([query, path]);
  }
  return result;
}
