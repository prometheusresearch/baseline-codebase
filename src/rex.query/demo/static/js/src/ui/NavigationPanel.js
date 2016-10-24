/**
 * @flow
 */

import type {Query, QueryPointer} from '../model';
import type {Actions} from '../state';

import React from 'react';

import * as q from '../model/Query';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import ColumnPicker from './ColumnPicker';

type AddColumnPanelProps = {
  pointer: QueryPointer<Query>;
  onClose: () => *;
  title: string;
};

export default class AddColumnPanel extends React.Component<*, AddColumnPanelProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {
    actions: React.PropTypes.object,
  };

  static defaultProps = {
    title: 'Database',
  };

  onSelect = (payload: {path: string}) => {
    let {path} = payload;
    let {pointer} = this.props;
    if (pointer.query.name === 'navigate' && pointer.query.path === '') {
      this.context.actions.replace({pointer, query: q.navigate(path)});
    } else {
      this.context.actions.navigate({pointer, path: [path]});
    }
  };

  onSelectRemove = (payload: {path: string; pointer: QueryPointer<>}) => {
    let {pointer} = payload;
    this.context.actions.cut(pointer);
  };

  render() {
    let {pointer, title, ...props} = this.props;
    return (
      <QueryPanelBase
        {...props}
        theme={theme.entity}
        title={title}>
        <ColumnPicker
          onSelect={this.onSelect}
          onSelectRemove={this.onSelectRemove}
          pointer={pointer}
          />
      </QueryPanelBase>
    );
  }
}
