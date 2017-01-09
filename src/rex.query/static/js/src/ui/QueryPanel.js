/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {SearchCallback} from './Search';

import React from 'react';

import * as q from '../model/Query';
import DefineQueryPanel from './DefineQueryPanel';
import AggregateQueryPanel from './AggregateQueryPanel';
import GroupQueryPanel from './GroupQueryPanel';
import FilterQueryPanel from './filter/FilterQueryPanel';
import NavigateQueryPanel from './NavigateQueryPanel';
import ErrorPanel from  './ErrorPanel';

type QueryPanelProps = {
  pointer: ?QueryPointer<Query>;
  onClose: () => *;
  onSearch: SearchCallback;
};

export default function QueryPanel(props: QueryPanelProps) {
  const {pointer, onClose, onSearch, ...rest} = props;

  if (pointer == null) {
    return <noscript />;
  }

  let topBanner = null;
  if (pointer.query.context.type.name === 'invalid') {
    topBanner = (
      <ErrorPanel borderBottom>
        This query combinator is invalid, either fix it or remove it.
      </ErrorPanel>
    );
  }

  return q.transformQuery(pointer.query, {
    navigate: query => (
      <NavigateQueryPanel
        {...rest}
        topBanner={topBanner}
        pointer={pointer}
        onClose={onClose}
        onSearch={onSearch}
        />
    ),
    define: query => (
      <DefineQueryPanel
        topBanner={topBanner}
        onClose={onClose}
        onSearch={onSearch}
        pointer={pointer}
        />
    ),
    aggregate: query => (
      <AggregateQueryPanel
        topBanner={topBanner}
        onClose={onClose}
        pointer={pointer}
        onSearch={onSearch}
        />
    ),
    group: query => (
      <GroupQueryPanel
        topBanner={topBanner}
        onClose={onClose}
        pointer={pointer}
        onSearch={onSearch}
        />
    ),
    filter: query => (
      <FilterQueryPanel
        {...rest}
        topBanner={topBanner}
        onClose={onClose}
        pointer={pointer}
        onSearch={onSearch}
        />
    ),
    otherwise: _query =>
      <noscript />
  });
}
