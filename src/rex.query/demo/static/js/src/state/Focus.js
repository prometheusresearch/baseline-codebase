/**
 * @flow
 */

import type {Query} from '../model';

import * as ArrayUtil from '../ArrayUtil';
import * as q from '../model/Query';

export type Focus = Array<string>;

export function chooseFocus(query: Query): Focus {
  let focusList = getFocuses(query);
  let lengths = focusList.map(f => f.length);
  let max = ArrayUtil.max(lengths);
  let idx = ArrayUtil.findIndexRight(lengths, l => l === max);
  return focusList[idx];
}

function getFocuses(query: Query): Array<Focus> {
  return getFocusesImpl(query, [], false);
}

function getFocusesImpl(query: Query, path: Array<string>, suppressPath: boolean) {
  switch (query.name) {
    case 'pipeline': {
      let result: Array<Array<string>> = [];
      let pipeline = q.flattenPipeline(query).pipeline;
      let localPath = [];
      for (let i = 0; i < pipeline.length; i++) {
        if (pipeline[i].name === 'navigate' && !suppressPath) {
          localPath = pipeline[i].path;
        }
        result = result.concat(getFocusesImpl(pipeline[i], path.concat(localPath), false));
      }
      return result;
    }
    case 'aggregate':
      return [];
    case 'navigate': {
      let type = query.context.type;
      return type && type.name === 'seq' ? [path] : [];
    }
    case 'select': {
      let result: Array<Focus> = [];
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          result = result.concat(getFocusesImpl(query.select[k], path.concat(k), true));
        }
      }
      return result;
    }
    default:
      return [];
  }
}
