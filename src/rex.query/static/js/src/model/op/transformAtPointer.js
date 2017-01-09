/**
 * @flow
 */

import type {QueryPipeline} from '../Query';
import type {QueryPointer} from '../QueryPointer';
import type {Transform} from './transformAtKeyPath';

import * as q from '../Query';
import * as qp from '../QueryPointer';
import transformAtKeyPath from './transformAtKeyPath';

export default function transformAtPointer(
  pointer: QueryPointer<*>,
  transform: Transform,
  transformPipeline?: (QueryPipeline) => QueryPipeline
): QueryPipeline {
  if (qp.prev(pointer) == null) {
    if (transform.type === 'insertAfter') {
      return q.pipeline(pointer.query, transform.value);
    } else if (transform.type === 'insertBefore') {
      return q.pipeline(transform.value, pointer.query);
    } else if (transform.type === 'replace') {
      return ((transform.value: any): QueryPipeline);
    } else {
      return pointer.root;
    }
  } else {
    let p = pointer;
    let query = pointer.query;
    let pPrev = qp.prev(p);
    while (p != null && pPrev != null) {
      let transformQueryWith = null;
      if (p === pointer) {
        transformQueryWith = transform;
      } else {
        transformQueryWith = {type: 'replace', value: query};
      }
      query = transformAtKeyPath(pPrev.query, p.path[p.path.length - 1], transformQueryWith);
      if (query == null) {
        return q.pipeline(q.here);
      }
      if (p === pointer && transformPipeline) {
        query = (transformPipeline(query): any);
      }
      p = pPrev;
      pPrev = qp.prev(p);
    }
    return ((query: any): QueryPipeline);
  }
}

