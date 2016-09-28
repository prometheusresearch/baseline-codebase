/**
 * @flow
 */

import * as q from './Query';

type Navigate = {
  type: 'navigate';
  navigate: Array<Select | Column>;
};

type Select = {
  type: 'select';
  select: Array<QueryNavigation>;
};

type Column = {
  type: 'column';
  path: string | number;
  title: string;
  query: q.NavigateQuery | q.AggregateQuery;
};

export type QueryNavigation
  = Navigate
  | Select
  | Column;

export function getQueryNavigation(query: q.Query): QueryNavigation {
  let navigation: Array<Select | Column> = [];
  switch (query.name) {
    case 'pipeline':
      let pipeline = q.flattenPipeline(query).pipeline;
      for (let i = 0; i < pipeline.length; i++) {
        let nav = getQueryNavigation(pipeline[i]);
        navigation = navigation.concat(
          nav.type === 'navigate'
            ? nav.navigate
            : nav
        );
      }
      break;
    case 'aggregate':
      navigation.push({
        type: 'column',
        path: 0,
        title: query.aggregate,
        query
      });
      break;
    case 'navigate':
      navigation.push({
        type: 'column',
        path: query.path,
        title: getColumnTitle(query),
        query
      });
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
  return navigation.length === 1
    ? navigation[0]
    : {type: 'navigate', navigate: navigation};
}

function getColumnTitle(query: q.NavigateQuery): string {
  if (query.context.domainEntityAttrtibute) {
    return query.context.domainEntityAttrtibute.title;
  } else if (query.context.domainEntity) {
    return query.context.domainEntity.title;
  } else {
    return query.path;
  }
}
