/**
 * This module implements operations on queries.
 *
 * @flow
 */

import type {Query} from './Query';
import type {KeyPath, QueryPointer} from './QueryPointer';

import invariant from 'invariant';
import * as q from './Query';
import * as qp from './QueryPointer';

type Transform
  = {type: 'replace'; value: any}
  | {type: 'insertAfter'; value: any};

export type QueryOperation = (
  // point at which operation should be performed
  pointer: QueryPointer<*>,
  selected: ?QueryPointer<*>
) => {query: ?Query, selected: ?QueryPointer<Query>};

export let noop: QueryOperation = (pointer) => {
  let query = qp.root(pointer).query;
  return {query, selected: null};
};

export let removeAt: QueryOperation = (pointer, selected) => {
  if (pointer.prev == null) {
    return {query: null, selected: null};
  }
  let query = transformAtPointer(pointer, {type: 'replace', value: undefined});
  return {query, selected: null};
};

export let transformAt = (
  pointer: QueryPointer<*>,
  selected: ?QueryPointer<*>,
  transform: (query: Query) => Query
) => {
  let nextValue = transform(pointer.query);
  let nextQuery = transformAtPointer(pointer, {type: 'replace', value: nextValue});
  let nextSelected = selected != null && nextQuery != null
    ? qp.rebase(selected, nextQuery)
    : selected;
  return {query: nextQuery, selected: nextSelected};
};

export let insertAfter = (pointer: QueryPointer<Query>, selected: ?QueryPointer<Query>, query: Query) => {
  let nextQuery;
  let nextSelected;

  if (pointer.prev == null) {
    if (pointer.query.name === 'pipeline') {
      let pipeline = pointer.query.pipeline;
      // $FlowIssue: why any in pipeline?
      nextQuery = q.pipeline(...pipeline, query);
      nextSelected = qp.select(qp.make(nextQuery), ['pipeline', pipeline.length]);
    } else {
      nextQuery = q.pipeline(pointer.query, query);
      nextSelected = qp.select(qp.make(nextQuery), ['pipeline', 1]);
    }
  } else {
    if (pointer.prev.query.name === 'pipeline') {
      nextQuery = transformAtPointer(
        pointer,
        {type: 'insertAfter', value: query}
      );
      invariant(nextQuery != null, 'Impossible');
      nextSelected = qp.move(
        qp.rebase(pointer, nextQuery),
        1
      );
    } else {
      nextQuery = transformAtPointer(
        pointer,
        {type: 'replace', value: q.pipeline(pointer.query, query)}
      );
      invariant(nextQuery != null, 'Impossible');
      nextSelected = qp.select(
        qp.rebase(pointer, nextQuery),
        ['pipeline', 1]
      );
    }
  }

  return {query: nextQuery, selected: nextSelected};
};

function normalize(q: Query): ?Query {
  switch (q.name) {
    case 'select':
      let nextSelect = {};
      let seenNone = false;
      let seenSome = false;
      for (let k in q.select) {
        if (q.select[k] != null) {
          nextSelect[k] = q.select[k];
          seenSome = true;
        } else {
          seenNone = true;
        }
      }
      if (seenNone) {
        if (seenSome) {
          return {...q, select: nextSelect};
        } else {
          return undefined;
        }
      }
      return q;
    case 'pipeline':
      if (q.pipeline.length === 0) {
        return undefined;
      }
      return q;
    case 'define':
      if (q.binding.query == null) {
        return undefined;
      }
      return q;
    default:
      return q;
  }
}

function transformAtPointer(pointer: QueryPointer<*>, transform: Transform): ?Query {
  if (pointer.prev == null) {
    if (transform.type === 'insertAfter') {
      return q.pipeline(pointer.query, transform.value);
    } else if (transform.type === 'replace') {
      return transform.value;
    }
  } else {
    let p = pointer;
    let query;
    while (p != null && p.prev != null) {
      query = transformAtKeyPath(
        p.prev.query,
        p.keyPath,
        p === pointer
          ? transform
          : {type: 'replace', value: query}
      );
      query = normalize(query);
      p = p.prev;
    }
    return query;
  }
}

function transformAtKeyPath(obj: Object, keyPath: KeyPath, value: Transform): Object {
  if (keyPath.length === 0) {
    return value.value;
  }
  let [key, ...ks] = keyPath;
  let updatedValue = transformAtKeyPath(obj[key], ks, value);
  if (Array.isArray(obj)) {
    let arr = obj.slice(0);
    if (ks.length === 0 && value.type === 'insertAfter') {
      arr.splice(key + 1, 0, updatedValue);
    } else if (updatedValue != null) {
      arr.splice(key, 1, updatedValue);
    } else {
      arr.splice(key, 1);
    }
    return arr;
  } else {
    return {
      ...obj,
      [key]: updatedValue
    };
  }
}
