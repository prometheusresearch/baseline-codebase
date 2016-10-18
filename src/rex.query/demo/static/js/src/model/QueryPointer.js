/**
 * @flow
 */

import type {Query} from './Query';

import invariant from 'invariant';

export type KeyPath = Array<number | string>;

/**
 * Query with a keyPath inside.
 */
export interface QueryPointer<+Q: Query = Query> {
  prev: ?QueryPointer<>;
  keyPath: KeyPath;
  query: Q;
};

export function make<Q: Query>(
  query: Q
): QueryPointer<Q> {
  return {
    // $FlowIssue: interfaces bug
    prev: null,
    query,
    keyPath: []
  };
}

export function select(
  pointer: QueryPointer<Query>,
  ...keyPath: Array<KeyPath>
): QueryPointer<Query> {

  if (keyPath.length === 0) {
    return pointer;
  }

  let q: Query;
  let p = pointer;

  for (let i = 0; i < keyPath.length; i++) {
    if (keyPath[i].length === 0) {
      continue;
    }
    q = getByKeyPath(p.query, keyPath[i]);
    invariant(q != null, 'Invalid pointer: %s', keyPath[i]);
    p = {
      prev: p,
      query: q,
      keyPath: keyPath[i],
    };
  }

  return p;
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
    if (ta[i].keyPath.join('.') !== tb[i].keyPath.join('.')) {
      return false;
    }
  }
  return true;
}

export function move(p: QueryPointer<Query>, d: number): QueryPointer<Query> {
  if (p.prev && p.prev.query.name === 'pipeline') {
    return select(p.prev, ['pipeline', p.keyPath[1] + d]);
  } else {
    return p;
  }
}

export function rebase(p: QueryPointer<*>, q: Query): QueryPointer<Query> {
  return select(make(q), ...trace(p).map(p => p.keyPath));
}

export function root(p: QueryPointer<*>): QueryPointer<Query> {
  while (p.prev != null) {
    p = p.prev;
  }
  return p;
}

export function trace(p: QueryPointer<*>): Array<QueryPointer<*>> {
  let trace = [p];
  while (p.prev != null) {
    p = p.prev;
    trace.unshift(p);
  }
  return trace;
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
