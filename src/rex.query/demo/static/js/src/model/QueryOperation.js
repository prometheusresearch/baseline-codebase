/**
 * This module implements operations on queries.
 *
 * @flow
 */

import type {Query} from './Query';
import type {KeyPath, QueryPointer} from './QueryPointer';

import invariant from 'invariant';
import * as t from './Type';
import * as q from './Query';
import * as qp from './QueryPointer';

type QueryState = {
  query: Query;
  selected: ?QueryPointer<*>;
};

type QueryPointerState = {
  pointer: QueryPointer<*>;
  selected: ?QueryPointer<*>;
};

type Transform
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
    return {query: q.here, selected: null};
  }
  let nextQuery = transformAtPointer(pointer, {type: 'replace', value: q.here});
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
  transform: (query: Query, selected: ?QueryPointer<*>) => {query: Query; selected?: ?QueryPointer<*>};
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

function growNavigation({query, path, ...options}: {
  query: Query;
  path: Array<string>;
}): {query: Query, keyPath: Array<KeyPath>} {
  let keyPath = [];

  if (path.length === 0) {
    return {query, keyPath};
  }

  const [key, ...rest] = path;

  query = q.transform(query, {

    select(current) {
      let {query, keyPath: nextKeyPath} = growNavigation({
        query: key in current.select
          ? current.select[key]
          : q.navigate(key),
        path: rest,
        ...options,
      });
      keyPath = [['select', key]].concat(nextKeyPath);
      return growSelect(current, {[key]: query}).query;
    },

    pipeline(current) {
      let last = current.pipeline[current.pipeline.length - 1];
      let pipeline = current.pipeline;
      if (current.pipeline.length === 0) {
        return current;
      } else if (last.name === 'select') {
        pipeline = pipeline.slice();
        pipeline.pop();
        let {query, keyPath: nextKeyPath} = growNavigation({
          query: last,
          path,
          ...options,
        });
        keyPath = [['pipeline', pipeline.length]].concat(nextKeyPath);
        return {
          name: 'pipeline',
          pipeline: pipeline.concat(query),
          context: current.context,
        };
      } else {
        let {query, keyPath: nextKeyPath} = growNavigation({
          query: q.navigate(key),
          path: rest,
          ...options
        });
        keyPath = [['pipeline', pipeline.length]].concat(nextKeyPath);
        return growPipeline(
          current,
          q.select({[key]: query})
        );
      }
    },

    otherwise(current) {
      let {query, keyPath: nextKeyPath} = growNavigation({
        query: q.navigate(key),
        path: rest,
        ...options
      });
      keyPath = [['pipeline', 1], ['select', key]].concat(nextKeyPath);
      return q.pipeline(
        current,
        q.select({[key]: query})
      );
    }

  });

  return {query, keyPath};
}

export function growNavigationLocal(query: Query): QueryState {
  let fields = {};
  let {type, domain, scope} = query.context;
  if (type != null) {
    type = t.atom(type);
    if (type.name === 'entity') {
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
        } else {
          fields[k] = q.navigate(k);
        }
      }
    } else if (type.name === 'text') {
      fields['0'] = q.navigate('0');
    } else if (type.name === 'number') {
      fields['0'] = q.navigate('0');
    }
  }

  for (let k in scope) {
    if (!scope.hasOwnProperty(k)) {
      continue;
    }
    let item = q.inferTypeStep(query.context, scope[k]);
    let type = item.context.type;
    if (type) {
      if (type.name === 'seq') {
        continue;
      }
      let baseType = t.atom(type);
      if (baseType.name === 'entity') {
        continue;
      } else {
        fields[k] = q.navigate(k);
      }
    } else {
      fields[k] = q.navigate(k);
    }
  }

  return growSelect(query, fields);
}

function navigationPathFromQueryPointer(pointer: QueryPointer<*>): Array<string> {
  return qp.trace(pointer)
    .map(pointer => {
      let pointerPrev = qp.prev(pointer);
      if (pointerPrev && pointerPrev.query.name === 'select') {
        return String(pointer.path[pointer.path.length - 1][1]);
      } else {
        return null;
      }
    })
    .filter(Boolean);
}

export let addNavigation = ({loc: {pointer, selected}, path}: {
  loc: QueryPointerState;
  path: Array<string>;
}): QueryState => {
  if (path.length === 0) {
    return {query: qp.root(pointer).query, selected: selected};
  } else {
    let {query, keyPath} = growNavigation({
      query: qp.root(pointer).query,
      path: navigationPathFromQueryPointer(pointer).concat(path),
    });
    let nextSelected = qp.select(qp.make(query), ...keyPath);
    return normalize({query, selected: nextSelected});
  }
};

export let removeNavigation = (
  pointer: QueryPointer<*>,
  selected: ?QueryPointer<*>,
  path: Array<string>,
): {query: Query; selected: ?QueryPointer<*>} => {
  if (path.length === 0) {
    return {query: qp.root(pointer).query, selected};
  }
  return {query: qp.root(pointer).query, selected};
};

/**
 * Normalize query.
 *
 * Normalization collapses all useless paths like nested pipelines and
 * combinators with here. It also tries to maintain a pointer which represents
 * selection.
 */
export function normalize({query, selected}: QueryState): QueryState {
  let path = selected
    ? selected.path
    : [];
  let {query: nextQuery, path: nextPath} = normalizeImpl(
    query,
    {path: [], rest: path}
  );
  return {
    query: nextQuery,
    selected: selected
      ? qp.make(nextQuery, ...nextPath)
      : null
  };
}

function normalizeImpl(
  query: Query,
  pathInfo: {
    path: Array<qp.KeyPath>;
    rest: Array<qp.KeyPath>;
  },
): {query: Query; path: Array<qp.KeyPath>} {
  return q.transform(query, {
    select: query => {
      let nextSelect = {};
      let path = pathInfo.path;
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
            if (item.path.length !== 0) {
              path = item.path;
            }
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
          path: path,
        };
      }
    },
    pipeline: query => {
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
              [(['pipeline', Math.max(0, i + delta)]: Array<string | number>)]);
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
        if (path.length > 0) {
          path.splice(pathInfo.path.length, 1);
        } else {
          path = pathInfo.path;
        }
        return {
          query: pipeline[0],
          path: path.length > 0 ? path : pathInfo.path,
        };
      } else {
        return {
          query: {name: 'pipeline', context: query.context, pipeline},
          path: path.length > 0 ? path : pathInfo.path,
        };
      }
    },
    define: query => {
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
    },
    otherwise: query => {
      return {query, path: pathInfo.path};
    }
  });
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
  if (qp.prev(pointer) == null) {
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
        return q.here;
      }
      p = pPrev;
      pPrev = qp.prev(p);
    }
    return query;
  }
}

function transformAtKeyPath(obj: Object, keyPath: KeyPath, value: Transform): ?Object {
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

export function growPipeline(
  query: q.QueryPipeline,
  ...items: Array<Query>
): q.QueryPipeline {
  let pipeline = query.pipeline.concat(items);
  return {...query, pipeline};
}

export function growSelect(
  query: Query,
  fields: {[key: string]: Query},
): QueryState {
  if (query.name === 'select') {
    let nextQuery = {
      name: 'select',
      select: {...query.select, ...fields},
      context: query.context,
    };
    return {query: nextQuery, selected: qp.make(nextQuery)};
  } else if (query.name === 'pipeline') {
    let last = query.pipeline[query.pipeline.length - 1];
    if (last.name === 'select') {
      let grown = growSelect(last, fields);
      let pipeline = query.pipeline
        .slice(0, query.pipeline.length - 1)
        .concat(grown.query);
      return {
        query: {
          name: 'pipeline',
          pipeline,
          context: query.context,
        },
        selected: grown.selected,
      };
    } else {
      let nextQuery = growPipeline(query, q.select(fields));
      return {
        query: nextQuery,
        selected: qp.make(nextQuery),
      }
    }
  } else {
    let nextQuery = q.pipeline(query, q.select(fields));
    return {
      query: nextQuery,
      selected: qp.make(nextQuery, ['pipeline', 0]),
    };
  }
}

