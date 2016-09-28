/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';

import * as q from '../model/Query';
import * as qo from '../model/QueryOperation';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import ColumnPicker from './ColumnPicker';

export default class NavigateQueryPanel extends React.Component {

  props: {
    pointer: QueryPointer<q.NavigateQuery>;
    onQuery: (query: ?Query, selected: ?QueryPointer<Query>) => *;
    onClose: () => *;
  }

  render() {
    let {pointer, onClose, onQuery} = this.props;
    let {query} = pointer;
    let title = `Navigate: ${query.path}`;
    return (
      <QueryPanelBase
        title={title}
        onClose={onClose}
        theme={theme.entity}
        onQuery={onQuery}
        pointer={pointer}>
        <ColumnPicker
          selected={[pointer.query.path]}
          options={q.getNavigationBefore(pointer.query.context)}
          onSelect={this.onSelect}
          />
      </QueryPanelBase>
    );
  }

  onSelect = (path: string) => {
    let {pointer, onQuery} = this.props;
    let p: QueryPointer<Query> = pointer;
    let {query, selected} = qo.transformAt(p, p, query => {
      return {name: 'navigate', path: path, context: query.context};
    });
    onQuery(query, selected);
  };
}
