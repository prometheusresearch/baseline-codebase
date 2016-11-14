/**
 * @flow
 */

import type {Query, SelectQuery, QueryPipeline} from '../model';

import * as ArrayUtil from '../ArrayUtil';
import {
  inferQueryType,
  transformQuery,
  flattenPipeline
} from '../model/Query';
import {
  maybeAtom
} from '../model/Type';

export type Focus = Array<string>;

export function chooseFocus(query: QueryPipeline): Focus {
  let focusList = getFocuses(query);
  let lengths = focusList.map(f => f.length);
  let max = ArrayUtil.max(lengths);
  let idx = ArrayUtil.findIndexRight(lengths, l => l === max);
  return focusList[idx];
}

function getFocuses(query: QueryPipeline): Array<Focus> {
  let focusList = getPipelineFocusList(query, [], {}, false);
  return focusList;
}

function getPipelineFocusList(
  query: QueryPipeline,
  path: Array<string>,
  defineMap: {[name: string]: QueryPipeline},
  suppressPath: boolean
) {
  let result: Array<Array<string>> = [];
  let type = maybeAtom(query.context.type);
  if (type == null) {
    return [];
  } else if (type.name === 'record') {
    // TODO: Remove flattenPipeline, make sure it's not needed.
    let pipeline = flattenPipeline(query).pipeline;
    let seenNavigate = false;
    let localPath = [];
    for (let i = 0; i < pipeline.length; i++) {
      let item = pipeline[i];
      if (item.name === 'define') {
        defineMap = {
          ...defineMap,
          // XXX: This needs to be fixed to use more stable identifiers for define
          // bindings. Currently shadowing isn't allowed and this is a bug.
          [item.binding.name]: item.binding.query,
        };
      }
      if (item.name === 'navigate' && !suppressPath) {
        localPath = item.path;
        seenNavigate = true;
      }
      if (item.name === 'navigate' && seenNavigate) {
        continue;
      }
      result = result.concat(
        getQueryFocusList(
          item,
          path.concat(localPath),
          defineMap,
          false
        )
      );
    }
    return result;
  } else {
    return [];
  }
}

function getSelectFocusList(
  query: SelectQuery,
  path: Array<string>,
  defineMap: {[name: string]: QueryPipeline},
  suppressPath: boolean
) {
  let result: Array<Focus> = [];
  for (let k in query.select) {
    if (!query.select.hasOwnProperty(k)) {
      continue;
    }
    let item = query.select[k];
    if (defineMap[k] != null) {
      item = inferQueryType(query.context.prev, defineMap[k]);
    }
    result = result.concat(
      getPipelineFocusList(
        item,
        path.concat(k),
        defineMap,
        true
      )
    );
  }
  return result;
}

function getQueryFocusList(
  query: Query,
  path: Array<string>,
  defineMap: {[name: string]: QueryPipeline},
  suppressPath: boolean
) {
  return transformQuery(query, {
    pipeline: _ => getPipelineFocusList(...arguments),
    select: _ => getSelectFocusList(...arguments),
    navigate: query => {
      let type = query.context.type;
      return type && type.name === 'seq'
        ? [path]
        : [];
    },
    otherwise: _query => [],
  });
}
