/**
 * @flow
 */

import type {Query} from '../model/types';
import type {SearchCallback} from './Search';

import React from 'react';

import * as q from '../model/Query';
import DefineQueryPanel from './DefineQueryPanel';
import AggregateQueryPanel from './AggregateQueryPanel';
import GroupQueryPanel from './GroupQueryPanel';
import FilterQueryPanel from './filter/FilterQueryPanel';
import NavigateQueryPanel from './NavigateQueryPanel';
import ErrorPanel from './ErrorPanel';

type QueryPanelProps = {
  query: Query,
  onClose: () => *,
  onSearch: SearchCallback,
};

export default function QueryPanel(props: QueryPanelProps) {
  const {query, onClose, onSearch, ...rest} = props;

  let topBanner = null;
  if (query.context.type.name === 'invalid') {
    topBanner = (
      <ErrorPanel borderBottom>
        This query combinator is invalid, either fix it or remove it.
      </ErrorPanel>
    );
  }

  return q.transformQuery(query, {
    navigate: query => (
      <NavigateQueryPanel
        {...rest}
        topBanner={topBanner}
        query={query}
        onClose={onClose}
        onSearch={onSearch}
      />
    ),
    define: query => (
      <DefineQueryPanel
        topBanner={topBanner}
        onClose={onClose}
        onSearch={onSearch}
        query={query}
      />
    ),
    aggregate: query => (
      <AggregateQueryPanel
        topBanner={topBanner}
        onClose={onClose}
        query={query}
        onSearch={onSearch}
      />
    ),
    group: query => (
      <GroupQueryPanel
        topBanner={topBanner}
        onClose={onClose}
        query={query}
        onSearch={onSearch}
      />
    ),
    filter: query => (
      <FilterQueryPanel
        {...rest}
        topBanner={topBanner}
        onClose={onClose}
        query={query}
        onSearch={onSearch}
      />
    ),
    otherwise: _query => <noscript />,
  });
}
