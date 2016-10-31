/**
 * @flow
 */

import type {Query, QueryPipeline} from './Query';

import invariant from 'invariant';

export type KeyPath = Array<number | string>;

/**
 * Query with a keyPath inside.
 */
export type QueryPointer<+Q: Query = Query> = {|
  +root: QueryPipeline;
  +path: Array<KeyPath>;
  +query: Q;
|};

export function make<Q: QueryPipeline>(
  query: Q,
  ...path: Array<KeyPath>
): QueryPointer<Q> {
  let root = query;
  for (let i = 0; i < path.length; i++) {
    query = getByKeyPath(query, path[i]);
    if (query == null) {
      invariant(false, 'Invalid query pointer with path: %s', path.join('.'));
    }
  }
  return {
    root: root,
    path: path,
    query: query,
  };
}

export let pointer = make;

export function select(
  pointer: QueryPointer<Query>,
  ...path: Array<KeyPath>
): QueryPointer<Query> {
  if (path.length === 0) {
    return pointer;
  }
  let query = pointer.query;
  for (let i = 0; i < path.length; i++) {
    query = getByKeyPath(query, path[i]);
    if (query == null) {
      invariant(false, 'Invalid query pointer with path: %s', path.join('.'));
    }
  }
  return {
    root: pointer.root,
    path: pointer.path.concat(path),
    query: query,
  };
}

export function spread(
  pointer: QueryPointer<Query>
): Array<QueryPointer<Query>> {
  if (pointer.query.name === 'pipeline') {
    return pointer.query.pipeline.map((q, idx) =>
      select(pointer, ['pipeline', idx]));
  } else {
    return [pointer];
  }
}

/**
 * Check two pointers for equality.
 */
export function is(a: ?QueryPointer<Query>, b: ?QueryPointer<Query>): boolean {
  if (a == null && b == null) {
    return true;
  } else if (a == null || b == null) {
    return false;
  }
  let ta = trace(a);
  let tb = trace(b);
  if (ta.length !== tb.length) {
    return false;
  }
  for (let i = 0; i < ta.length; i++) {
    // TODO: do we need to check for query type?
    if (ta[i].path.join('.') !== tb[i].path.join('.')) {
      return false;
    }
  }
  return true;
}

export function prev(p: QueryPointer<>): ?QueryPointer<> {
  if (p.path.length === 0) {
    return null;
  } else {
    let path = p.path.slice(0, p.path.length - 1);
    return make(p.root, ...path);
  }
}

export function move(p: QueryPointer<Query>, d: number): QueryPointer<Query> {
  let pPrev = prev(p);
  if (pPrev && pPrev.query.name === 'pipeline') {
    let path = pPrev.path.slice(0);
    path.push(['pipeline', p.path[p.path.length - 1][1] + d]);
    return make(pPrev.root, ...path);
  } else {
    return p;
  }
}

export function rebase(
  pointer: QueryPointer<*>,
  query: QueryPipeline,
  until?: (query: Query) => boolean,
): QueryPointer<Query> {
  let trace = [{query, path: []}];
  let root = query;

  for (let i = 0; i < pointer.path.length; i++) {
    let nextQuery = getByKeyPath(query, pointer.path[i]);

    let path = pointer.path.slice(0, i + 1);

    if (query.name === 'pipeline' && path.length > 0) {
      let [_, idx] = path[path.length - 1];
      for (let j = 0; j < ((idx: any): number); j++) {
        let segment = ['pipeline', j];
        let jPath = path.slice(0, path.length - 1).concat([segment]);
        let jQuery = getByKeyPath(query, segment);
        if (jQuery) {
          trace.push({path: jPath, query: jQuery});
        }
      }
    }

    if (nextQuery == null) {
      break;
    } else {
      trace.push({path, query: nextQuery});
      query = nextQuery;
    }
  }


  if (until) {
    while (trace.length > 1) {
      if (until(trace[trace.length - 1].query)) {
        break;
      } else {
        trace.pop();
      }
    }
  }

  return {
    root,
    query: trace[trace.length - 1].query,
    path: trace[trace.length - 1].path,
  };
}

export function root(p: QueryPointer<*>): QueryPointer<Query> {
  return make(p.root);
}

export function trace(p: QueryPointer<*>): Array<QueryPointer<*>> {
  let path = [];
  let trace = [make(p.root)];
  for (let i = 0; i < p.path.length; i++) {
    path.push(p.path[i]);
    trace.push(make(p.root, ...path));
  }
  return trace;
}

export function repr(p: ?QueryPointer<*>): ?string {
  if (p == null) {
    return null;
  } else {
    return reprPath(p.path);
  }
}

export function reprPath(path: Array<KeyPath>): ?string {
  if (path.length === 0) {
    return '<pointer>';
  } else {
    return `<pointer ${path.map(p => p.join('.')).join(':')}>`;
  }
}

function getByKeyPath(obj: mixed, keyPath: KeyPath): any {
  for (let i = 0; i < keyPath.length; i++) {
    if (obj == null) {
      return obj;
    }
    if (typeof obj !== 'object') {
      return obj;
    }
    let key = keyPath[i];
    // $FlowIssue: ok
    obj = obj[key];
  }
  return obj;
}
