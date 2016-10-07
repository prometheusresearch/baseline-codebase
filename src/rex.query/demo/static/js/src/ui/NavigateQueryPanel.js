/**
 * @flow
 */

import type {QueryPointer} from '../model/QueryPointer';
import type {NavigateQuery} from '../model/Query';
import type {QueryBuilderActions} from '../QueryBuilder';

import React from 'react';

import * as q from '../model/Query';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import ColumnPicker from './ColumnPicker';

export default class NavigateQueryPanel extends React.Component {

  props: {
    pointer: QueryPointer<NavigateQuery>;
    onClose: () => *;
  };

  context: {actions: QueryBuilderActions};

  static contextTypes = {actions: React.PropTypes.object};

  render() {
    let {pointer, onClose} = this.props;
    let {query} = pointer;
    let title = `Navigate: ${query.path}`;
    return (
      <QueryPanelBase
        title={title}
        onClose={onClose}
        theme={theme.entity}
        pointer={pointer}>
        <ColumnPicker
          before
          pointer={pointer}
          selected={[pointer.query.path]}
          onSelect={this.onSelect}
          />
      </QueryPanelBase>
    );
  }

  onSelect = (path: string) => {
    this.context.actions.replace(
      this.props.pointer,
      q.navigate(path),
    );
  };
}
