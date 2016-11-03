/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';

import * as t from '../model/Type';
import * as q from '../model/Query';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import DefineQueryPanel from './DefineQueryPanel';
import AggregateQueryPanel from './AggregateQueryPanel';
import FilterQueryPanel from './filter/FilterQueryPanel';
import {MenuHelp} from './menu';

type QueryPanelProps = {
  pointer: ?QueryPointer<Query>;
  onClose: () => *;
};

export default function QueryPanel(props: QueryPanelProps) {
  const {pointer, onClose, ...rest} = props;

  if (pointer == null) {
    return null;
  }

  return q.transformQuery(pointer.query, {
    navigate: query => (
      <QueryPanelBase
        {...rest}
        title={getTitleFromPointer(pointer)}
        onClose={onClose}
        theme={theme.entity}
        pointer={pointer}>
        <MenuHelp>
          This page is intentionally made blank for now.
        </MenuHelp>
      </QueryPanelBase>
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
    filter: query => (
      <FilterQueryPanel
        {...rest}
        onClose={onClose}
        pointer={pointer}
        />
    ),
    otherwise: _query =>
      null,
  });
}

function getTitleFromPointer(pointer) {
  let {domain, type} = pointer.query.context;
  type = t.maybeAtom(type);
  if (type == null) {
    return null;
  } else if (type.name === 'entity') {
    let entity = domain.entity[type.entity];
    if (entity == null) {
      return null;
    }
    return entity.title;
  } else {
    return null;
  }
}
