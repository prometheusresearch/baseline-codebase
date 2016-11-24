/**
 * @flow
 */

import type {Query, SelectQuery, QueryPipeline} from '../model';

import * as ArrayUtil from '../ArrayUtil';
import {
  transformQuery
} from '../model/Query';

export type Focus = Array<string>;

export function chooseFocus(query: QueryPipeline): Focus {
  let focusList = getFocuses(query);
  let lengths = focusList.map(f => f.length);
  let max = ArrayUtil.max(lengths);
  let idx = ArrayUtil.findIndexRight(lengths, l => l === max);
  return focusList[idx];
}

function getFocuses(query: QueryPipeline): Array<Focus> {
  let focusList = getPipelineFocusList(query, [], false);
  return focusList;
}

function getPipelineFocusList(
  query: QueryPipeline,
  path: Array<string>,
  suppressPath: boolean
) {
  let result: Array<Array<string>> = [];
  let type = query.context.type;
  if (type.name === 'invalid') {
    return [];
  } else if (type.name === 'record') {
    let pipeline = query.pipeline;
    let seenNavigate = false;
    let localPath = [];
    for (let i = 0; i < pipeline.length; i++) {
      let item = pipeline[i];
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
  suppressPath: boolean
) {
  let result: Array<Focus> = [];
  for (let k in query.select) {
    if (!query.select.hasOwnProperty(k)) {
      continue;
    }
    let item = query.select[k];
    if (query.context.scope[k] != null) {
      item = query.context.scope[k].query;
    }
    result = result.concat(
      getPipelineFocusList(
        item,
        path.concat(k),
        true
      )
    );
  }
  return result;
}

function getQueryFocusList(
  query: Query,
  path: Array<string>,
  suppressPath: boolean
) {
  return transformQuery(query, {
    pipeline: _ => getPipelineFocusList(...arguments),
    select: _ => getSelectFocusList(...arguments),
    navigate: query => {
      let type = query.context.type;
      return type && type.card === 'seq'
        ? [path]
        : [];
    },
    otherwise: _query => [],
  });
}
