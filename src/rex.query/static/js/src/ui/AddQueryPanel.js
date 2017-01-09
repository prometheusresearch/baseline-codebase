/**
 * @flow
 */

import type {Query, QueryPipeline, QueryPointer} from '../model';
import type {Actions} from '../state';
import type {SearchCallback} from './Search';

import React from 'react';
import {VBox, HBox} from 'react-stylesheet';
import * as css from 'react-stylesheet/css';

import * as qp from '../model/QueryPointer';
import * as qn from '../model/QueryNavigation';

import * as theme from './Theme';
import {MenuGroup, MenuButton, MenuButtonSecondary} from './menu';
import QueryPanelBase from './QueryPanelBase';
import {IconPlus} from './Icon';
import TagLabel from './TagLabel';
import Label from './Label';
import NavigationMenu from './NavigationMenu';

type AddColumnPanelProps = {
  pointer: QueryPointer<Query>;
  onSearch: SearchCallback;
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
    let {pointer, onSearch, ...props} = this.props;
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
          onSearch={onSearch}
          />
      </QueryPanelBase>
    );
  }
}

type AddQueryMenuProps = {
  pointer: QueryPointer<QueryPipeline>;
  onSearch: SearchCallback;
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
    let {pointer: {query: {context}}, onSearch} = this.props;
    let isAtRoot = context.type.name === 'void';
    return (
      <NavigationMenu onSearch={onSearch} context={context}>
        <AddQueryMenuSection
          noNavigate={isAtRoot}
          nonHierarchical={isAtRoot}
          onAdd={this.onAdd}
          onNavigate={this.onNavigate}
          onAggregate={this.onAggregate}
          context={context}
          path={[]}
          />
      </NavigationMenu>
    );
  }
}

function AddQueryMenuSection({
  context, path, onAdd, onNavigate, onAggregate, noNavigate, nonHierarchical,
  navigation
}) {
  return (
    <MenuGroup>
      {Array.from(navigation.values()).map(item =>
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
    </MenuGroup>
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
    if (this.props.item.context.type.name === 'record') {
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
          title={`Follow ${item.label} and discard all other attributes`}
          onClick={this.onNavigate}
          key="navigate">
          Follow {item.label}
        </MenuButtonSecondary>,
        item.regularContext.type.card === 'seq' &&
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
    } else if (item.context.type.name === 'record') {
      icon = open ? '▾' : '▸';
    }

    return (
      <VBox
        background="#f1f1f1"
        borderBottom={open ? '1px solid #ddd' : 'none'}>
        <MenuButton
          icon={icon}
          title={`Add ${item.label} query`}
          iconTitle={open ? "Collapse" : "Expand"}
          onClick={this.onAddQuery}
          onIconClick={!nonHierarchical && this.toggleOpen}
          menu={menu.length > 0 ? menu : null}>
          <HBox flexGrow={1} alignItems="center">
            <VBox flexGrow={1} flexShrink={1}>
              <Label label={item.label} />
            </VBox>
            {item.fromQuery &&
              <TagLabel marginLeft="auto">Query</TagLabel>}
          </HBox>
        </MenuButton>
        {!nonHierarchical && open &&
          <AddQueryMenuButtonMenu
            onAdd={onAdd}
            onNavigate={onNavigate}
            onAggregate={onAggregate}
            context={item.context}
            path={path}
            noNavigate={noNavigate}
            />}
      </VBox>
    );
  }
}

function AddQueryMenuButtonMenu({onAdd, onNavigate, onAggregate, context, path, noNavigate}) {
  let navigation = qn.getNavigation(context, false);
  return (
    <VBox
      marginLeft={15}
      borderLeft={css.border(1, '#ddd')}>
      <AddQueryMenuSection
        navigation={navigation}
        onAdd={onAdd}
        onNavigate={onNavigate}
        onAggregate={onAggregate}
        context={context}
        path={path}
        noNavigate={noNavigate}
      />
    </VBox>
  );
}
