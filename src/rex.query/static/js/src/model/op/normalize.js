/**
 * Normalize query.
 *
 * Normalization collapses all useless paths like nested pipelines and
 * combinators with here. It also tries to maintain a pointer which represents
 * selection.
 *
 * Note that types of the queries should be maintained as an invariant during
 * this transformation. Therefore only type-preserving transformations are
 * allowed.
 *
 * @flow
 */

import type {Query, QueryPipeline} from '../Query';
import type {QueryPointer, KeyPath} from '../QueryPointer';

import {transformQuery, here} from '../Query';
import * as q from '../Query';
import {pointer} from '../QueryPointer';

type PathInfo = {
  path: Array<KeyPath>;
  rest: Array<KeyPath>;
};

type Result<Q: Query> = {
  query: Q;
  path: Array<KeyPath>;
};

export default function normalize({
  query,
  selected
}: {
  query: QueryPipeline;
  selected: ?QueryPointer<>;
}): {query: QueryPipeline; selected: ?QueryPointer<>} {
  let path = selected
    ? selected.path
    : [];

  let {query: nextQuery, path: nextPath} = normalizeQueryPipeline(
    query,
    {path: [], rest: path}
  );

  if (nextQuery.pipeline[0].name !== 'here') {
    nextQuery = {
      name: 'pipeline',
      pipeline: [q.here].concat(nextQuery.pipeline),
      context: nextQuery.context,
    };
    if (nextPath.length > 0) {
      nextPath = [
        ['pipeline', nextPath[0][1] + 1]
      ].concat(nextPath.slice(1));
    }
  }

  return {
    query: nextQuery,
    selected: selected
      ? pointer(nextQuery, ...nextPath)
      : null
  };
}

function normalizeQueryPipeline(
  query: QueryPipeline,
  pathInfo: PathInfo,
): Result<QueryPipeline> {
  let pipeline = [];
  let path = [];
  let delta = 0;
  for (let i = 0; i < query.pipeline.length; i++) {
    let item = normalizeQuery(
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
        if (item.path.length !== 0) {
          let slicedPath = item.path.slice(pathInfo.path.length + 2);
          path = pathInfo.path.concat(
            [['pipeline', i + delta]],
            slicedPath,
          );
        }
      } else {
        pipeline.push(item.query);
        if (item.path.length !== 0) {
          let slicedPath = item.path.slice(pathInfo.path.length + 1);
          path = pathInfo.path.concat(
            [['pipeline', i + delta]],
            slicedPath,
          );
        }
      }
    }
  }
  if (pipeline.length === 0) {
    return {
      query: q.pipeline(here),
      path: pathInfo.path,
    };
  } else {
    return {
      query: {name: 'pipeline', context: query.context, pipeline},
      path: path.length > 0 ? path : pathInfo.path,
    };
  }
}

function normalizeQuery(query: Query, pathInfo: PathInfo): Result<Query> {
  return transformQuery(query, {
    select: query => {
      let nextSelect = {};
      let path = pathInfo.path;
      let seenSome = false;
      for (let k in query.select) {
        if (!query.select.hasOwnProperty(k)) {
          continue;
        }
        let item = normalizeQuery(
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
      if (seenSome) {
        return {
          query: {name: 'select', select: nextSelect, context: query.context},
          path: path,
        };
      } else {
        return {
          query: here,
          path: path,
        };
      }
    },

    pipeline: q => {
      let {query, path} = normalizeQueryPipeline(q, pathInfo);
      if (query.pipeline.length === 1 && query.pipeline[0].name === 'here') {
        // FIXME: path!!!
        query = query.pipeline[0];
      }
      return {query, path};
    },

    define: query => {
      let r = normalizeQueryPipeline(
        query.binding.query,
        consumePath(pathInfo, ['binding', 'query'])
      );
      if (isEmptyPipeline(r.query)) {
        return {
          query: here,
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

function isEmptyPipeline(query: q.QueryPipeline): boolean {
  return (
    query.pipeline.length === 0 ||
    (query.pipeline.length === 1 && query.pipeline[0].name === 'here')
  );
}

function consumePath(pathInfo: PathInfo, prefix: KeyPath) {
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
