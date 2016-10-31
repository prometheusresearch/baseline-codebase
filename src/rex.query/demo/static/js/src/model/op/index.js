/**
 * This module implements operations on queries.
 *
 * @flow
 */

import invariant from 'invariant';

import type {Query, QueryPipeline} from '../Query';
import type {KeyPath, QueryPointer} from '../QueryPointer';

import * as q from '../Query';
import * as qp from '../QueryPointer';
import normalize from './normalize';

export {default as normalize} from './normalize';
export {default as reconcileNavigation} from './reconcileNavigation';
export {default as growNavigation} from './growNavigation';

export type QueryState = {
  query: QueryPipeline;
  selected: ?QueryPointer<*>;
};

export type QueryPointerState = {
  pointer: QueryPointer<*>;
  selected: ?QueryPointer<*>;
};

export type Transform
  = {type: 'replace'; value: Query}
  | {type: 'cut'}
  | {type: 'insertAfter'; value: Query}
  | {type: 'insertBefore'; value: Query};

/**
 * Noop.
 */
export let noop = ({pointer}: QueryPointerState) => {
  let query = qp.root(pointer).query;
  return {query, selected: null};
};

/**
 * Remove query at pointer.
 */
export let removeAt = ({pointer, selected} : QueryPointerState) => {
  if (qp.prev(pointer) == null) {
    return {
      query: q.pipeline(q.here),
      selected: null
    };
  }
  let nextQuery = transformAtPointer(
    pointer, {
      type: 'replace',
      value: q.pipeline(q.here),
    });
  return normalize({query: nextQuery, selected});
};

/**
 * Cut a query at pointer removing query at pointer and all subsequent queries.
 */
export let cutAt = ({loc}: {loc: QueryPointerState}) => {
  let query = transformAtPointer(loc.pointer, {type: 'cut'});
  let selected = loc.selected;
  return normalize({query, selected});
};

/**
 * Transform query at pointer.
 */
export let transformAt = ({loc: {pointer, selected}, transform}: {
  loc: QueryPointerState;
  transform: (
    query: Query,
    selected: ?QueryPointer<*>
  ) => {
    query: Query;
    selected?: ?QueryPointer<*>;
  };
}) => {
  let {
    query: nextValue,
    selected: diffSelected
  } = transform(pointer.query, selected);
  let nextQuery = transformAtPointer(pointer, {type: 'replace', value: nextValue});
  let nextSelected = selected != null && nextQuery != null
    ? qp.select(
        qp.rebase(selected, nextQuery),
        ...(diffSelected ? diffSelected.path : [])
      )
    : null;
  return normalize({query: nextQuery, selected: nextSelected});
};

export let insertAfter = (
  {pointer, selected}: QueryPointerState,
  query: Query,
  fixSelection?: (selected: ?QueryPointer<*>) => ?QueryPointer<*>
) => {
  let nextQuery;
  let nextSelected;

  let pointerPrev = qp.prev(pointer);
  if (pointerPrev == null) {
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
    if (pointerPrev.query.name === 'pipeline') {
      nextQuery = transformAtPointer(
        pointer,
        {type: 'insertAfter', value: query}
      );
      nextSelected = qp.move(
        qp.rebase(pointer, nextQuery),
        1
      );
    } else {
      nextQuery = transformAtPointer(
        pointer,
        {type: 'replace', value: q.pipeline(pointer.query, query)}
      );
      nextSelected = qp.select(
        qp.rebase(pointer, nextQuery),
        ['pipeline', 1]
      );
    }
  }

  if (fixSelection) {
    nextSelected = fixSelection(nextSelected);
  }

  return normalize({query: nextQuery, selected: nextSelected});
};

export let insertBefore = (
  {pointer, selected}: QueryPointerState,
  query: Query
) => {
  let nextQuery;
  let nextSelected;

  let pointerPrev = qp.prev(pointer);
  if (pointerPrev == null) {
    if (pointer.query.name === 'pipeline') {
      let pipeline = pointer.query.pipeline;
      nextQuery = q.pipeline(query, ...pipeline);
      nextSelected = qp.select(qp.make(nextQuery), ['pipeline', 0]);
    } else {
      nextQuery = q.pipeline(query, pointer.query);
      nextSelected = qp.select(qp.make(nextQuery), ['pipeline', 0]);
    }
  } else {
    if (pointerPrev.query.name === 'pipeline') {
      nextQuery = transformAtPointer(
        pointer,
        {type: 'insertBefore', value: query}
      );
      invariant(nextQuery != null, 'Impossible');
      nextSelected = qp.move(
        qp.rebase(pointer, nextQuery),
        -1
      );
    } else {
      nextQuery = transformAtPointer(
        pointer,
        {type: 'replace', value: q.pipeline(query, pointer.query)}
      );
      invariant(nextQuery != null, 'Impossible');
      nextSelected = qp.select(
        qp.rebase(pointer, nextQuery),
        ['pipeline', 0]
      );
    }
  }

  return normalize({query: nextQuery, selected: nextSelected});
};

function transformAtPointer(
  pointer: QueryPointer<*>,
  transform: Transform
): QueryPipeline {
  if (qp.prev(pointer) == null) {
    if (transform.type === 'insertAfter') {
      return q.pipeline(pointer.query, transform.value);
    } else if (transform.type === 'insertBefore') {
      return q.pipeline(transform.value, pointer.query);
    } else if (transform.type === 'replace') {
      return ((transform.value: any): QueryPipeline);
    } else {
      return pointer.root;
    }
  } else {
    let p = pointer;
    let query = pointer.query;
    let pPrev = qp.prev(p);
    while (p != null && pPrev != null) {
      query = transformAtKeyPath(
        pPrev.query,
        p.path[p.path.length - 1],
        p === pointer
          ? transform
          : {type: 'replace', value: query}
      );
      if (query == null) {
        return q.pipeline(q.here);
      }
      p = pPrev;
      pPrev = qp.prev(p);
    }
    return ((query: any): QueryPipeline);
  }
}

function transformAtKeyPath(
  obj: Object,
  keyPath: KeyPath,
  value: Transform
): ?Object {
  if (keyPath.length === 0) {
    if (value.type === 'cut') {
      return q.here;
    } else {
      return value.value;
    }
  }
  let [key, ...ks] = keyPath;
  let updatedValue = transformAtKeyPath(obj[key], ks, value);
  if (Array.isArray(obj)) {
    let arr = obj.slice(0);
    if (ks.length === 0 && value.type === 'insertAfter') {
      arr.splice(key + 1, 0, updatedValue);
    } else if (ks.length === 0 && value.type === 'insertBefore') {
      arr.splice(key, 0, updatedValue);
    } else if (ks.length === 0 && value.type === 'cut') {
      arr = arr.slice(0, key);
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
