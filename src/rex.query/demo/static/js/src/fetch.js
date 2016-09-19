/**
 * @flow
 */

import type {Query} from './model/Query';
import * as q from './model/Query';

export function fetch(api: string, query: Query): Promise<Object> {
  return window.fetch(api, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(translate(query))
  }).then(response => response.json());
}

/**
 * Translate UI query model into query syntax.
 */
export function translate(query: Query) {
  return translateImpl(query, null);
}

function translateImpl(query, prev) {
  switch (query.name) {
    case 'aggregate':
      return [query.aggregate, prev];
    case 'pipeline':
      return query.pipeline.reduce((prev, q) => {
        let tq = translateImpl(q, prev);
        return tq != null ? tq : q;
      }, prev);
    case 'select':
      let fields = [];
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          fields.push(translateImpl(query.select[k], null));
        }
      }
      return ['select', prev].concat(fields);
    case 'navigate':
      if (prev != null) {
        return ['.', prev, ['navigate', query.path]];
      } else {
        return ['navigate', query.path];
      }
    default:
      return null;
  }
}
