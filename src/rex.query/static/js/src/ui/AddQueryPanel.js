/**
 * @flow
 */

import type {Context, Query, QueryPipeline, QueryPointer} from '../model';
import type {Actions} from '../state';

import React from 'react';
import {VBox, HBox} from 'react-stylesheet';
import * as css from 'react-stylesheet/css';

import * as t from '../model/Type';
import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';

import * as theme from './Theme';
import {MenuGroup, MenuButton, MenuButtonSecondary} from './menu';
import QueryPanelBase from './QueryPanelBase';
import {IconPlus} from './Icon';
import TagLabel from './TagLabel';

type AddColumnPanelProps = {
  pointer: QueryPointer<Query>;
  onClose: () => *;
};

export default class AddQueryPanel extends React.Component<*, AddColumnPanelProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {
    actions: React.PropTypes.object,
  };


  render() {
    let {pointer, ...props} = this.props;
    let isTopLevel = pointer.path.length === 1;
    let title = isTopLevel
      ? 'Pick a starting relationship'
      : 'Link';
    return (
      <QueryPanelBase
        {...props}
        theme={theme.placeholder}
        title={title}>
        <AddQueryMenu
          pointer={pointer}
          />
      </QueryPanelBase>
    );
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

  onAggregate = ({path}) => {
    let pipeline = qp.prev(this.props.pointer);
    let domain = this.props.pointer.query.context.domain;
    this.context.actions.appendDefineAndAggregate({
      pointer: ((pipeline: any): QueryPointer<QueryPipeline>),
      path,
      aggregate: domain.aggregate.count,
    });
  };

  render() {
    let {pointer} = this.props;

    let isAtRoot = pointer.query.context.type.name === 'void';

    return (
      <MenuGroup title="Relationships">
        <AddQueryMenuSection
          noNavigate={isAtRoot}
          nonHierarchical={isAtRoot}
          onAdd={this.onAdd}
          onNavigate={this.onNavigate}
          onAggregate={this.onAggregate}
          query={pointer.query}
          path={[]}
          />
      </MenuGroup>
    );
  }
}

function AddQueryMenuSection({
  query, path, onAdd, onNavigate, onAggregate, noNavigate, nonHierarchical
}) {
  let prev = path[path.length - 2];
  let nav = getNavigation(query.context, path)
    // We filter out backlinks.
    .filter(item => item.value !== prev);
  return (
    <VBox>
      {nav.map(item =>
        <AddQueryMenuButton
          nonHierarchical={nonHierarchical}
          noNavigate={noNavigate}
          key={item.value}
          item={item}
          path={path.concat(item.value)}
          onAdd={onAdd}
          onNavigate={onNavigate}
          onAggregate={onAggregate}
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

  onAggregate = () => {
    this.props.onAggregate({path: this.props.path});
  };

  render() {
    let {
      item, path,
      onAdd, onNavigate, onAggregate,
      noNavigate, nonHierarchical,
    } = this.props;
    let {open} = this.state;

    let menu = [];
    if (!noNavigate) {
      menu.push(
        <MenuButtonSecondary
          icon="⇩"
          title={`Go to ${item.label} and discard all other attributes`}
          onClick={this.onNavigate}
          key="navigate">
          Go to {item.label}
        </MenuButtonSecondary>,
        item.pathType.card === 'seq' &&
          <MenuButtonSecondary
            icon="∑"
            title={`Compute summarizations for ${item.label}`}
            onClick={this.onAggregate}
            key="summarize">
            Summarize {item.label}
          </MenuButtonSecondary>,
      );
    }

    let icon = null;

    if (nonHierarchical) {
      icon = <IconPlus />;
    } else if (item.query.context.type.name === 'record') {
      icon = open ? '▾' : '▸';
    }

    return (
      <VBox style={{
        background: '#f1f1f1',
        borderBottom: open ? '1px solid #ddd' : 'none',
      }}>
        <MenuButton
          icon={icon}
          title={`Add ${item.label} query`}
          iconTitle={open ? "Collapse" : "Expand"}
          onClick={this.onAddQuery}
          onIconClick={!nonHierarchical && this.toggleOpen}
          menu={menu.length > 0 ? menu : null}>
          <HBox flexGrow={1} alignItems="center">
            <VBox flexGrow={1}>
              {item.label}
            </VBox>
            {item.fromQuery &&
              <TagLabel>Query</TagLabel>}
          </HBox>
        </MenuButton>
        {!nonHierarchical && open &&
          <VBox
            marginLeft={15}
            style={{borderLeft: css.border(1, '#ddd')}}>
            <AddQueryMenuSection
              onAdd={onAdd}
              onNavigate={onNavigate}
              onAggregate={onAggregate}
              query={item.query}
              path={path}
              noNavigate={noNavigate}
            />
          </VBox>}
      </VBox>
    );
  }
}

function getNavigation(context: Context, path: Array<string>) {
  let {type, scope, domain} = context;
  let navigation = [];

  // Collect paths from an input type
  if (type.name === 'void') {
    for (let k in domain.entity) {
      if (domain.entity.hasOwnProperty(k)) {
        let navQuery = q.inferQueryType(q.regularizeContext(context), q.navigate(k));
        let pathType = q.inferQueryType(
          path.length === 0 ? q.regularizeContext(context) : context,
          q.navigate(k)
        ).context.type;
        navigation.push({
          type: 'record',
          value: k,
          label: domain.entity[k].title,
          query: navQuery,
          fromQuery: false,
          pathType,
        });
      }
    }
  } else if (type.name === 'record') {
    let attribute = t.recordAttribute(type);
    for (let k in attribute) {
      if (attribute.hasOwnProperty(k)) {
        let navQuery = q.inferQueryType(q.regularizeContext(context), q.navigate(k));
        let pathType = q.inferQueryType(
          path.length === 0 ? q.regularizeContext(context) : context,
          q.navigate(k)
        ).context.type;
        navigation.push({
          type: navQuery.context.type.name === 'record'
            ? 'record'
            : 'attribute',
          value: k,
          label: attribute[k].title || k,
          query: navQuery,
          fromQuery: false,
          pathType,
        });
      }
    }
  }

  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      let navQuery = q.inferQueryType(q.regularizeContext(context), scope[k].query);
      let pathType = q.inferQueryType(
        path.length === 0 ? q.regularizeContext(context) : context,
        q.navigate(k)
      ).context.type;
      navigation.push({
        type: 'record',
        value: k,
        label: q.genQueryName(navQuery) || k,
        query: navQuery,
        fromQuery: true,
        pathType,
      });
    }
  }

  return navigation;
}
