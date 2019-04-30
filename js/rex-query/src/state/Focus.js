/**
 * @flow
 */

import type { Query, SelectQuery, QueryPipeline } from "../model/types";

import * as ArrayUtil from "../ArrayUtil";
import * as q from "../model/Query";

export type Focus = Array<string>;

export function chooseFocus(query: QueryPipeline): Focus {
  let focusList = getFocuses(query);
  let lengths = focusList.map(f => f.length);
  let max = ArrayUtil.max(lengths);
  let idx = ArrayUtil.findIndexRight(lengths, l => l === max);
  return focusList[idx];
}

function getFocuses(query: QueryPipeline): Array<Focus> {
  let focusList = getPipelineFocusList(query, []);
  return focusList;
}

function getPipelineFocusList(query: QueryPipeline, path: Array<string>) {
  let result: Array<Array<string>> = [];
  let type = query.context.type;
  if (type.name !== "invalid") {
    let pipeline = query.pipeline;
    let localPath = [];
    for (let i = 0; i < pipeline.length; i++) {
      let item = pipeline[i];

      if (item.name === "navigate") {
        let nextItem = pipeline[i + 1];
        if (nextItem && nextItem.name === "navigate") {
          continue;
        }
      }

      result = result.concat(getQueryFocusList(item, path.concat(localPath)));
    }
    return result;
  } else {
    return [];
  }
}

function getSelectFocusList(query: SelectQuery, path: Array<string>) {
  let result: Array<Focus> = [];
  for (let k in query.select) {
    if (!query.select.hasOwnProperty(k)) {
      continue;
    }
    let item = query.select[k];
    if (query.context.scope[k] != null) {
      item = query.context.scope[k].query;
    }
    if (item.context.type.card === "seq") {
      result = result.concat(getPipelineFocusList(item, path.concat(k)));
    }
  }
  return result;
}

function getQueryFocusList(query: Query, path: Array<string>) {
  return q.transformQuery(query, {
    pipeline: _ => getPipelineFocusList(...arguments),
    select: _ => getSelectFocusList(...arguments),
    navigate: query => {
      let type = query.context.type;
      return type && type.card === "seq" ? [path] : [];
    },
    otherwise: _query => []
  });
}
