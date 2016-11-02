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
import transformAtPointer from './transformAtPointer';

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
