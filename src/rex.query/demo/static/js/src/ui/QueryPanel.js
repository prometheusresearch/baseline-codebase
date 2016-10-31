/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';

import * as t from '../model/Type';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import DefineQueryPanel from './DefineQueryPanel';
import NavigationPanel from './NavigationPanel';
import FilterQueryPanel from './filter/FilterQueryPanel';

type QueryPanelProps = {
  pointer: ?QueryPointer<Query>;
  onClose: () => *;
};

export default function QueryPanel(props: QueryPanelProps) {
  const {pointer, onClose} = props;

  if (pointer == null) {
    return null;
  }

  let query = pointer.query;

  switch (query.name) {
    case 'pipeline':
      return null;
    case 'navigate': {
      let {domain, type} = query.context;
      let title = getTitleFromType(domain, type) || query.path;
      return (
        <NavigationPanel
          title={title}
          pointer={pointer}
          onClose={onClose}
          />
      );
    }
    case 'select': {
      let {domain, inputType} = query.context;
      let title = getTitleFromType(domain, inputType) || "Select";
      return (
        <NavigationPanel
          title={title}
          pointer={pointer}
          onClose={onClose}
          />
      );
    }
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
          title={`${query.aggregate}`}
          onClose={onClose}
          theme={theme.aggregate}
          pointer={pointer}>
        </QueryPanelBase>
      );
    case 'here':
      return (
        <NavigationPanel
          pointer={pointer}
          onClose={onClose}
          />
      );
    case 'limit':
      return null;
    default:
      return null
  }
}

function getTitleFromType(domain, type) {
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
