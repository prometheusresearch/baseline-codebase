/**
 * @flow
 */

export {getNavigation} from './QueryNavigation';

import type {Context, QueryPipeline} from './types';
import {getInsertionPoint} from './QueryOperation';

export function getPipelineContext(pipeline: QueryPipeline): Context {
  return getInsertionPoint(pipeline).context;
}
