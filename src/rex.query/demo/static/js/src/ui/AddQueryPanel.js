/**
 * @flow
 */

import type {Type, Query, QueryPipeline, QueryPointer} from '../model';
import type {Actions} from '../state';

import React from 'react';

import * as q from '../model/Query';
import * as t from '../model/Type';
import * as qp from '../model/QueryPointer';
import * as theme from './Theme';
import {MenuHelp, MenuGroup, MenuButton} from './menu';
import QueryPanelBase from './QueryPanelBase';
import ColumnPicker from './ColumnPicker';
import AddAggregateMenu from './AddAggregateMenu';

type AddColumnPanelProps = {
  pointer: QueryPointer<Query>;
  onClose: () => *;
};

export default class AddQueryPanel extends React.Component<*, AddColumnPanelProps, *> {

  context: {
    actions: Actions;
  };

  state: {
    activeTab: null | 'aggregate';
  } = {
    activeTab: null,
  };

  static contextTypes = {
    actions: React.PropTypes.object,
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

  onActiveTabAggregate = (ev: UIEvent) => {
    ev.stopPropagation();
    this.setState(state => ({...state, activeTab: 'aggregate'}));
  };

  onActiveTabDefault = (ev: UIEvent) => {
    ev.stopPropagation();
    this.setState(state => ({...state, activeTab: null}));
  };

  onFilter = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.appendFilter({pointer: this.props.pointer});
  };

  render() {
    let {pointer, ...props} = this.props;
    let {activeTab} = this.state;
    let pipeline = getPipeline(pointer);
    let canFilter = canFilterAt(pointer.query.context.type);
    let canAggregate = canAggregateAt(pointer.query.context.type);
    if (activeTab == null) {
      return (
        <QueryPanelBase
          {...props}
          theme={theme.placeholder}
          title="Add">
          {(canAggregate || canFilter) &&
            <MenuGroup paddingV={20}>
              {canFilter &&
                <MenuButton
                  icon="＋"
                  onClick={this.onFilter}>
                  Filter
                </MenuButton>}
              {canAggregate &&
                <MenuButton
                  icon="＋"
                  onClick={this.onActiveTabAggregate}>
                  Summarize
                </MenuButton>}
            </MenuGroup>}
          <ColumnPicker
            showAddMenu
            onSelect={this.onSelect}
            onSelectRemove={this.onSelectRemove}
            pointer={pointer}
            />
        </QueryPanelBase>
      );
    } else if (activeTab === 'aggregate') {
      return (
        <QueryPanelBase
          {...props}
          onBack={this.onActiveTabDefault}
          theme={theme.placeholder}
          title="Summarize">
          {pipeline &&
            <AddAggregateMenu
              pointer={pipeline}
              />}
        </QueryPanelBase>
      );
    }
  }
}

function getPipeline(pointer: QueryPointer<>): ?QueryPointer<QueryPipeline> {
  if (pointer.query.name === 'pipeline') {
    return (pointer: any);
  } else {
    let p = qp.prev(pointer);
    if (p != null) {
      return getPipeline(p);
    } else {
      return null;
    }
  }
}

function canFilterAt(type: ?Type) {
  return isSeqAt(type);
}

function canAggregateAt(type: ?Type) {
  return isSeqAt(type);
}

function isSeqAt(type: ?Type) {
  return (
    type &&
    type.name === 'seq'
  );
}
