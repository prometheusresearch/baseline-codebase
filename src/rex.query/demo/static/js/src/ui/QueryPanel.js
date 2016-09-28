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

type QueryPanelProps = {
  pointer: ?QueryPointer<Query>;
  onQuery: (query: ?Query, selected: ?QueryPointer<Query>) => *;
  onClose: () => *;
};

export default function QueryPanel(props: QueryPanelProps) {
  const {pointer, onQuery, onClose} = props;

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
          onQuery={onQuery}
          />
      );
    case 'filter':
      return (
        <QueryPanelBase
          title={pointer.query.name}
          onClose={onClose}
          theme={theme.filter}
          onQuery={onQuery}
          pointer={pointer}>
        </QueryPanelBase>
      );
    case 'define':
      return (
        <QueryPanelBase
          title={pointer.query.name}
          onClose={onClose}
          theme={theme.traverse}
          onQuery={onQuery}
          pointer={pointer}>
        </QueryPanelBase>
      );
    case 'aggregate':
      return (
        <QueryPanelBase
          title={pointer.query.aggregate}
          onClose={onClose}
          theme={theme.aggregate}
          onQuery={onQuery}
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
