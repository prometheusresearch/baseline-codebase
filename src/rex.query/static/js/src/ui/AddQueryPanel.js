/**
 * @flow
 */

import type {Type, Query, QueryPipeline, QueryPointer} from '../model';
import type {Actions} from '../state';

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';
import * as css from 'react-stylesheet/css';

import * as t from '../model/Type';
import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';

import * as theme from './Theme';
import {MenuGroup, MenuButton, MenuButtonSecondary} from './menu';
import QueryPanelBase from './QueryPanelBase';
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

  onActiveTabNavigate = (ev: UIEvent) => {
    ev.stopPropagation();
    this.setState(state => ({...state, activeTab: 'navigate'}));
  };

  onActiveTabDefault = (ev: UIEvent) => {
    ev.stopPropagation();
    this.setState(state => ({...state, activeTab: null}));
  };

  onFilter = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.appendFilter({pointer: this.props.pointer});
  };

  onGroup = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.appendGroup({pointer: this.props.pointer});
  };

  render() {
    let {pointer, ...props} = this.props;
    let {activeTab} = this.state;
    let type = pointer.query.context.type;
    let pipeline = getPipeline(pointer);
    let canFilter = canFilterAt(type);
    let canGroup = canGroupAt(type);
    let canAggregate = canAggregateAt(type);
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
              {canGroup &&
                <MenuButton
                  icon="＋"
                  onClick={this.onGroup}>
                  Group
                </MenuButton>}
            </MenuGroup>}
          <AddQueryMenu
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

type AddQueryMenuProps = {
  pointer: QueryPointer<QueryPipeline>;
};

class AddQueryMenu extends React.Component<*, AddQueryMenuProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {
    actions: React.PropTypes.object,
  };

  onAdd = ({path}) => {
    this.context.actions.appendDefine({
      pointer: this.props.pointer,
      path,
      select: true,
    });
  };

  onNavigate = ({path}) => {
    this.context.actions.appendNavigate({
      pointer: this.props.pointer,
      path,
    });
  };

  render() {
    let {pointer} = this.props;

    return (
      <MenuGroup title="Relationships">
        <AddQueryMenuSection
          noNavigate={pointer.query.context.type.name === 'void'}
          onAdd={this.onAdd}
          onNavigate={this.onNavigate}
          query={pointer.query}
          path={[]}
          />
      </MenuGroup>
    );
  }
}

function AddQueryMenuSection({query, path, onAdd, onNavigate, noNavigate}) {
  let prev = path[path.length - 2];
  let nav = getNavigation(query)
    // We filter out backlinks.
    .filter(item => item.value !== prev);
  return (
    <VBox>
      {nav.map(item =>
        <AddQueryMenuButton
          noNavigate={noNavigate}
          key={item.value}
          item={item}
          path={path.concat(item.value)}
          onAdd={onAdd}
          onNavigate={onNavigate}
          />)}
    </VBox>
  );
}

class AddQueryMenuButton extends React.Component {

  state: {
    open: boolean
  } = {
    open: false
  };

  toggleOpen = (e: UIEvent) => {
    e.stopPropagation();
    if (this.props.item.query.context.type.name === 'record') {
      this.setState(state =>
        ({...state, open: !state.open}));
    }
  };

  onAddQuery = (e: UIEvent) => {
    e.stopPropagation();
    this.props.onAdd({path: this.props.path});
  };

  onNavigate = () => {
    this.props.onNavigate({path: this.props.path});
  };

  render() {
    let {item, path, onAdd, onNavigate, noNavigate} = this.props;
    let {open} = this.state;

    let menu = [];
    if (!noNavigate) {
      menu.push(
        <MenuButtonSecondary
          icon="⇩"
          onClick={this.onNavigate}
          key="navigate">
          Focus {item.label}
        </MenuButtonSecondary>
      );
    }

    let icon = null;

    if (item.query.context.type.name === 'record') {
      icon = open ? '▾' : '▸';
    }

    return (
      <VBox style={{background: '#f1f1f1'}}>
        <MenuButton
          icon={icon}
          title="Add query"
          iconTitle={open ? "Collapse" : "Expand"}
          style={{fontWeight: open ? 400 : 200}}
          onClick={this.onAddQuery}
          onIconClick={this.toggleOpen}
          menu={menu.length > 0 ? menu : null}>
          {item.label}
        </MenuButton>
        {open &&
          <VBox
            marginLeft={15}
            style={{borderLeft: css.border(1, '#ddd')}}>
            <AddQueryMenuSection
              onAdd={onAdd}
              onNavigate={onNavigate}
              query={item.query}
              path={path}
              noNavigate={noNavigate}
            />
          </VBox>}
      </VBox>
    );
  }
}

function getNavigation(query: Query) {
  let {context} = query;
  let {type, scope, domain} = context;
  let navigation = [];

  // Collect paths from an input type
  if (type.name === 'void') {
    for (let k in domain.entity) {
      if (domain.entity.hasOwnProperty(k)) {
        let navQuery = q.inferQueryType(context, q.navigate(k));
        navigation.push({
          type: 'record',
          value: k,
          label: domain.entity[k].title,
          query: navQuery,
        });
      }
    }
  } else if (type.name === 'record') {
    let attribute = t.recordAttribute(type);
    for (let k in attribute) {
      if (attribute.hasOwnProperty(k)) {
        let navQuery = q.inferQueryType(context, q.navigate(k));
        navigation.push({
          type: navQuery.context.type.name === 'record'
            ? 'record'
            : 'attribute',
          value: k,
          label: attribute[k].title || k,
          query: navQuery,
        });
      }
    }
  }

  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      let navQuery = q.inferQueryType(context, scope[k].query);
      navigation.push({
        type: 'record',
        value: k,
        label: k,
        query: navQuery,
      });
    }
  }

  return navigation;
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

function canFilterAt(type: Type) {
  return isSeqAt(type);
}

function canAggregateAt(type: Type) {
  return isSeqAt(type);
}


function canGroupAt(type: Type) {
  return type.card === 'seq' && type.name === 'record';
}

function isSeqAt(type: Type) {
  return type.card === 'seq';
}
