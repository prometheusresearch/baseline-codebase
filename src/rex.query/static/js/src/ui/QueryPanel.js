/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';

import * as q from '../model/Query';
import DefineQueryPanel from './DefineQueryPanel';
import AggregateQueryPanel from './AggregateQueryPanel';
import GroupQueryPanel from './GroupQueryPanel';
import FilterQueryPanel from './filter/FilterQueryPanel';
import NavigateQueryPanel from './NavigateQueryPanel';

type QueryPanelProps = {
  pointer: ?QueryPointer<Query>;
  onClose: () => *;
};

export default function QueryPanel(props: QueryPanelProps) {
  const {pointer, onClose, ...rest} = props;

  if (pointer == null) {
    return <noscript />;
  }

  return q.transformQuery(pointer.query, {
    navigate: query => (
      <NavigateQueryPanel
        {...rest}
        pointer={pointer}
        onClose={onClose}
        />
    ),
    define: query => (
      <DefineQueryPanel
        onClose={onClose}
        pointer={pointer}
        />
    ),
    aggregate: query => (
      <AggregateQueryPanel
        onClose={onClose}
        pointer={pointer}
        />
    ),
    group: query => (
      <GroupQueryPanel
        onClose={onClose}
        pointer={pointer}
        />
    ),
    filter: query => (
      <FilterQueryPanel
        {...rest}
        onClose={onClose}
        pointer={pointer}
        />
    ),
    otherwise: _query =>
      <noscript />
  });
}
