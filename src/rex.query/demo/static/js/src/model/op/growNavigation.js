/**
 * This module implements operations on queries.
 *
 * @flow
 */

import invariant from 'invariant';

import type {QueryState, QueryPointerState} from './index';
import type {QueryPipeline} from '../Query';
import type {KeyPath, QueryPointer} from '../QueryPointer';

import * as q from '../Query';
import * as qp from '../QueryPointer';
import transformAtPointer from './transformAtPointer';

export default function growNavigation({loc: {pointer, selected}, path}: {
  loc: QueryPointerState;
  path: Array<string>;
}): QueryState {
  let p = pointer.query.name !== 'pipeline'
    ? qp.prev(pointer)
    : pointer;
  invariant(
    p && p.query.name === 'pipeline',
    'Malformed query structure'
  );
  let {query, keyPath} = growNavigationImpl(p.query, path);
  query = transformAtPointer(p, {type: 'replace', value: query});
  keyPath = p.path.concat(keyPath);
  return {query, selected: qp.make(query, ...keyPath)};
}

function growNavigationImpl(
  query: QueryPipeline,
  path: Array<string>
): {
  query: QueryPipeline,
  keyPath: Array<KeyPath>
} {

  if (path.length === 0) {
    return {
      query,
      keyPath: [['pipeline', query.pipeline.length - 1]]
    };
  }

  let [key, ...rest] = path;
  let tail = query.pipeline[query.pipeline.length - 1];

  if (tail.name === 'select') {
    let res = growNavigationImpl(
      tail.select[key] || q.pipeline(q.navigate(key)),
      rest
    );
    let pipeline = query.pipeline;
    pipeline.pop();
    pipeline = pipeline.concat(
      q.select({
        ...tail.select,
        [key]: res.query,
      })
    );
    return {
      query: {
        name: 'pipeline',
        context: query.context,
        pipeline
      },
      keyPath: [
        ['pipeline', pipeline.length - 1],
        ['select', key]
      ].concat(res.keyPath),
    };
  } else {
    let res = growNavigationImpl(
      q.pipeline(q.navigate(key)),
      rest
    );
    let pipeline = query.pipeline;
    pipeline = query.pipeline.concat(
      q.select({
        [key]: res.query,
      })
    );
    return {
      query: {
        name: 'pipeline',
        context: query.context,
        pipeline
      },
      keyPath: [
        ['pipeline', pipeline.length - 1],
        ['select', key],
      ].concat(res.keyPath),
    };
  }
}

function pathFromPointer(pointer: QueryPointer<*>): Array<string> {
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
