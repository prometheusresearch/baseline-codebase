/**
 * @flow
 */

import type {Context, QueryPipeline} from './types';
import {getInsertionPoint} from './QueryOperation';

export {getNavigation} from './QueryNavigation';

export function getPipelineContext(pipeline: QueryPipeline): Context {
  return getInsertionPoint(pipeline).context;
}
