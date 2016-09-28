/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {QueryBuilderActions} from '../QueryBuilder';

import React from 'react';

import * as q from '../model/Query';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import NavigateQueryPanel from './NavigateQueryPanel';
import DefineQueryPanel from './DefineQueryPanel';

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
        <QueryPanelBase
          title={pointer.query.name}
          onClose={onClose}
          theme={theme.filter}
          pointer={pointer}>
        </QueryPanelBase>
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
          title={pointer.query.aggregate}
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
