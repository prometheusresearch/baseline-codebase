/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';

import * as q from '../model/Query';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import NavigateQueryPanel from './NavigateQueryPanel';
import DefineQueryPanel from './DefineQueryPanel';
import FilterQueryPanel from './FilterQueryPanel';


type QueryPanelProps = {
  pointer: ?QueryPointer<Query>;
  onClose: () => *;
};

export default function QueryPanel(props: QueryPanelProps) {
  const {pointer, onClose} = props;

  if (pointer == null) {
    return null;
  }

  switch (pointer.query.name) {
    case 'pipeline':
      return null;
    case 'navigate':
      let p: QueryPointer<q.NavigateQuery> = (pointer: any);
      return (
        <NavigateQueryPanel
          pointer={p}
          onClose={onClose}
          />
      );
    case 'filter':
      return (
        <FilterQueryPanel
          onClose={onClose}
          pointer={pointer}
          />
      );
    case 'define':
      return (
        <DefineQueryPanel
          onClose={onClose}
          pointer={pointer}
          />
      );
    case 'aggregate':
      return (
        <QueryPanelBase
          title={`Aggregate: ${pointer.query.aggregate}`}
          onClose={onClose}
          theme={theme.aggregate}
          pointer={pointer}>
        </QueryPanelBase>
      );
    case 'select':
      return null;
    case 'limit':
      return null;
    default:
      return null
  }
}
