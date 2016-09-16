/**
 * @flow
 */

import invariant from 'invariant';
import * as q from './Query';

export type QueryNavigation
  = {type: 'column', query: q.NavigateQuery}
  | {type: 'select', select: Array<QueryNavigation>}
  | {type: 'navigate', navigate: Array<QueryNavigation>};

export function getQueryNavigation(query: q.Query): QueryNavigation {
  let navigation: Array<QueryNavigation> = [];
  switch (query.name) {
    case 'pipeline':
      let pipeline = q.flattenPipeline(query).pipeline;
      for (let i = 0; i < pipeline.length; i++) {
        navigation = navigation.concat(getQueryNavigation(pipeline[i]));
      }
      break;
    case 'navigate':
      navigation.push({type: 'column', query});
      break;
    case 'select':
      let select = [];
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          select.push(getQueryNavigation(query.select[k]));
        }
      }
      navigation.push({type: 'select', select});
      break;
    default:
      break;
  }
  return {type: 'navigate', navigate: navigation};
}
