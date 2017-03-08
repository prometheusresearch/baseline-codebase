/**
 * @flow
 */

export type {
  Query,
  QueryAtom,
  QueryPipeline,
  DefineQuery,
  NavigateQuery,
  SelectQuery,
  AggregateQuery,
  GroupQuery,
  FilterQuery,
  Expression,
  Context,
} from './Query';

export type {QueryLoc} from './QueryLoc';

export type {QueryNavigation} from './QueryNavigation';

export {getNavigation} from './QueryNavigation';

export type {Type, TypeCardinality} from './Type';

export type {Domain, DomainEntity, DomainAttribute} from './Domain';

import {type Context, type QueryPipeline} from './Query';
import {getInsertionPoint} from './QueryOperation';

export function getPipelineContext(pipeline: QueryPipeline): Context {
  return getInsertionPoint(pipeline).context;
}
