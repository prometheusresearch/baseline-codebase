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
  = {type: 'replace'; value: Query}
  | {type: 'insertAfter'; value: Query}
  | {type: 'insertBefore'; value: Query};

export type QueryOperation = (
  // point at which operation should be performed
  pointer: QueryPointer<*>,
  selected: ?QueryPointer<*>
) => {query: Query, selected: ?QueryPointer<Query>};

export let noop: QueryOperation = (pointer) => {
  let query = qp.root(pointer).query;
  return {query, selected: null};
};

export let removeAt: QueryOperation = (pointer, selected) => {
  if (pointer.prev == null) {
    return {query: q.here, selected: null};
  }
  let nextQuery = transformAtPointer(pointer, {type: 'replace', value: q.here});
  return normalize(nextQuery, selected);
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
  return normalize(nextQuery, nextSelected);
};

export let insertAfter = (
  pointer: QueryPointer<Query>,
  selected: ?QueryPointer<Query>,
  query: Query,
  fixSelection?: (selected: ?QueryPointer<*>) => ?QueryPointer<*>
) => {
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

  return normalize(nextQuery, nextSelected);
};

export let insertBefore = (pointer: QueryPointer<Query>, selected: ?QueryPointer<Query>, query: Query) => {
  let nextQuery;
  let nextSelected;

  if (pointer.prev == null) {
    if (pointer.query.name === 'pipeline') {
      let pipeline = pointer.query.pipeline;
      nextQuery = q.pipeline(query, ...pipeline);
      nextSelected = qp.select(qp.make(nextQuery), ['pipeline', 0]);
    } else {
      nextQuery = q.pipeline(query, pointer.query);
      nextSelected = qp.select(qp.make(nextQuery), ['pipeline', 0]);
    }
  } else {
    if (pointer.prev.query.name === 'pipeline') {
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

  return normalize(nextQuery, nextSelected);
};

/**
 * Normalize query.
 *
 * Normalization collapses all useless paths like nested pipelines and
 * combinators with here. It also tries to maintain a pointer which represents
 * selection.
 */
export function normalize(
  query: Query,
  selected: ?QueryPointer<*>
): {query: Query; selected: ?QueryPointer<*>} {
  let path = selected
    ? qp.trace(selected).map(p => p.keyPath)
    : [];
  let {query: nextQuery, path: nextPath} = normalizeImpl(
    query,
    {path: [], rest: path.slice(1)}
  );
  return {
    query: nextQuery,
    selected: selected
      ? qp.select(qp.make(nextQuery), ...nextPath)
      : null
  };
}

function normalizeImpl(
  query: Query,
  pathInfo: {
    path: Array<qp.KeyPath>,
    rest: Array<qp.KeyPath>
  },
): {query: Query; path: Array<qp.KeyPath>} {
  switch (query.name) {
    case 'select': {
      let nextSelect = {};
      let path = [];
      let seenSome = false;
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          let item = normalizeImpl(
            query.select[k],
            consumePath(pathInfo, ['select', k])
          );
          if (item.query.name !== 'here') {
            nextSelect[k] = item.query;
            seenSome = true;
          }
          if (item.path.length !== 0) {
            path = item.path;
          }
        }
      }
      if (seenSome) {
        return {
          query: {name: 'select', select: nextSelect, context: query.context},
          path: path,
        };
      } else {
        return {
          query: q.here,
          path: pathInfo.path,
        };
      }
    }
    case 'pipeline': {
      let pipeline = [];
      let path = [];
      let delta = 0;
      for (let i = 0; i < query.pipeline.length; i++) {
        let item = normalizeImpl(
          query.pipeline[i],
          consumePath(pathInfo, ['pipeline', i])
        );
        if (item.query.name === 'here') {
          // selected node is going to be removed, move select up
          delta -= 1;
          if (item.path.length !== 0) {
            path = pathInfo.path.concat(
              [['pipeline', Math.max(0, i + delta)]]);
          }
        } else {
          if (item.query.name === 'pipeline') {
            pipeline.push(...item.query.pipeline);
          } else {
            pipeline.push(item.query);
          }
          if (item.path.length !== 0) {
            path = pathInfo.path.concat(
              [['pipeline', i + delta]],
              item.path.slice(pathInfo.path.length + 1)
            );
          }
        }
      }
      if (pipeline.length === 0) {
        return {
          query: q.here,
          path: pathInfo.path,
        };
      } else if (pipeline.length === 1) {
        return {
          query: pipeline[0],
          path: pathInfo.path,
        };
      } else {
        return {
          query: {name: 'pipeline', context: query.context, pipeline},
          path: path,
        };
      }
    }
    case 'define':
      let r = normalizeImpl(
        query.binding.query,
        consumePath(pathInfo, ['binding', 'query'])
      );
      if (r.query.name === 'here') {
        return {
          query: q.here,
          path: pathInfo.path,
        };
      } else {
        return {
          query: {
            name: 'define',
            binding: {
              name: query.binding.name,
              query: r.query,
            },
            context: query.context,
          },
          path: r.path.length > 0 ? r.path : pathInfo.path,
        };
      }
    case 'here':
      return {query, path: pathInfo.path};
    default:
      return {query, path: pathInfo.path};
  }
}

function consumePath(
  pathInfo: {
    path: Array<qp.KeyPath>;
    rest: Array<qp.KeyPath>;
  },
  prefix: qp.KeyPath) {
  if (pathInfo.rest.length === 0) {
    return {path: [], rest: []};
  }
  let rest = pathInfo.rest.slice(0);
  let item = rest.shift().slice(0);
  if (prefix.length !== item.length) {
    return {path: [], rest: []};
  }
  for (let i = 0; i < prefix.length; i++) {
    if (item[i] !== prefix[i]) {
      return {path: [], rest: []};
    }
  }
  return {path: pathInfo.path.concat([prefix]), rest};
}

function transformAtPointer(pointer: QueryPointer<*>, transform: Transform): Query {
  if (pointer.prev == null) {
    if (transform.type === 'insertAfter') {
      return q.pipeline(pointer.query, transform.value);
    } else if (transform.type === 'insertBefore') {
      return q.pipeline(transform.value, pointer.query);
    } else if (transform.type === 'replace') {
      return transform.value;
    } else {
      return pointer.query;
    }
  } else {
    let p = pointer;
    let query = pointer.query;
    while (p != null && p.prev != null) {
      query = transformAtKeyPath(
        p.prev.query,
        p.keyPath,
        p === pointer
          ? transform
          : {type: 'replace', value: query}
      );
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
    } else if (ks.length === 0 && value.type === 'insertBefore') {
      arr.splice(key, 0, updatedValue);
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
