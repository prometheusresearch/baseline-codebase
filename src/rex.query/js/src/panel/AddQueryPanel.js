/**
 * @flow
 */

import type {QueryNavigation, Context, QueryPipeline} from '../model/types';
import type {Actions} from '../state';
import type {SearchCallback} from '../ui/Search';

import React from 'react';
import {VBox, HBox} from 'react-stylesheet';
import * as css from 'react-stylesheet/css';

import * as t from '../model/Type';
import * as qn from '../model/QueryNavigation';
import {Theme, Menu, Icon, Label, TagLabel, NavigationMenu} from '../ui';
import QueryPanelBase from './QueryPanelBase';

type AddQueryPanelProps = {
  pipeline: QueryPipeline,
  onSearch?: SearchCallback,
  title?: string,
  onClose: () => *,
};

export default class AddQueryPanel extends React.Component<AddQueryPanelProps> {
  context: {
    actions: Actions,
  };

  static contextTypes = {
    actions: React.PropTypes.object,
  };

  render() {
    let {pipeline, onSearch, title = 'Pick', ...props} = this.props;
    return (
      <QueryPanelBase {...props} theme={Theme.placeholder} title={title}>
        <AddQueryMenu pipeline={pipeline} onSearch={onSearch} />
      </QueryPanelBase>
    );
  }
}

type AddQueryMenuProps = {
  pipeline: QueryPipeline,
  onSearch?: SearchCallback,
};

class AddQueryMenu extends React.Component<AddQueryMenuProps> {
  context: {
    actions: Actions,
  };

  static contextTypes = {
    actions: React.PropTypes.object,
  };

  onAdd = ({path}) => {
    this.context.actions.appendDefine({
      at: this.props.pipeline,
      path,
      select: true,
    });
  };

  onNavigate = ({path}) => {
    this.context.actions.appendNavigate({
      at: this.props.pipeline,
      path,
    });
  };

  onAggregate = ({path}) => {
    let {pipeline} = this.props;
    let {aggregate} = pipeline.context.domain;
    this.context.actions.appendDefineAndAggregate({
      at: pipeline,
      path,
      aggregate: aggregate.count,
    });
  };

  render() {
    let {pipeline: {pipeline}, onSearch} = this.props;
    let context =
      pipeline[pipeline.length - 1].name === 'select'
        ? pipeline[pipeline.length - 2].context
        : pipeline[pipeline.length - 1].context;
    let isAtRoot = context.type.name === 'void';
    return (
      <NavigationMenu onSearch={onSearch} context={context}>
        {navigation =>
          <AddQueryMenuSection
            navigation={navigation}
            noNavigate={isAtRoot}
            nonHierarchical={isAtRoot}
            onAdd={this.onAdd}
            onNavigate={this.onNavigate}
            onAggregate={this.onAggregate}
            context={context}
            path={[]}
          />}
      </NavigationMenu>
    );
  }
}

type AddQueryMenuSectionProps = {
  context: Context,
  path: Array<string>,
  onAdd: Function,
  onNavigate: Function,
  onAggregate: Function,
  noNavigate?: boolean,
  nonHierarchical?: boolean,
  navigation?: Map<string, QueryNavigation>,
};

function AddQueryMenuSection({
  context,
  path,
  onAdd,
  onNavigate,
  onAggregate,
  noNavigate,
  nonHierarchical,
  navigation,
}: AddQueryMenuSectionProps) {
  return (
    <Menu.MenuGroup>
      {navigation &&
        Array.from(navigation.values()).map(item =>
          <AddQueryMenuButton
            nonHierarchical={nonHierarchical}
            noNavigate={noNavigate}
            key={item.value}
            item={item}
            path={path.concat(item.value)}
            onAdd={onAdd}
            onNavigate={onNavigate}
            onAggregate={onAggregate}
          />,
        )}
    </Menu.MenuGroup>
  );
}

type AddQueryMenuButtonState = {
  open: boolean,
};

class AddQueryMenuButton extends React.Component<*, AddQueryMenuButtonState> {
  state = {
    open: false,
  };

  toggleOpen = (e: UIEvent) => {
    e.stopPropagation();
    if (t.isRecordLike(this.props.item.context.type)) {
      this.setState(state => ({...state, open: !state.open}));
    }
  };

  onAddQuery = (e?: UIEvent) => {
    if (e != null) {
      e.stopPropagation();
    }
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
      item,
      path,
      onAdd,
      onNavigate,
      onAggregate,
      noNavigate,
      nonHierarchical,
    } = this.props;
    let {open} = this.state;

    let menu = [];
    if (!noNavigate) {
      menu.push(
        <Menu.MenuButtonSecondary
          icon="⇩"
          title={`Follow ${item.label} and discard all other attributes`}
          onClick={this.onNavigate}
          key="navigate">
          Follow {item.label}
        </Menu.MenuButtonSecondary>,
        item.regularContext.type.card === 'seq' &&
          <Menu.MenuButtonSecondary
            icon="∑"
            title={`Compute summarizations for ${item.label}`}
            onClick={this.onAggregate}
            key="summarize">
            Summarize {item.label}
          </Menu.MenuButtonSecondary>,
        <Menu.MenuButtonSecondary
          icon={<Icon.IconPlus />}
          title={`Link "${item.label}" query`}
          onClick={this.onAddQuery}
          key="define">
          Link {item.label}
        </Menu.MenuButtonSecondary>,
      );
    }

    let icon = null;

    if (nonHierarchical) {
      icon = <Icon.IconPlus />;
    } else if (t.isRecordLike(item.context.type)) {
      icon = open ? '▾' : '▸';
    }

    return (
      <VBox background="#f1f1f1" borderBottom={open ? '1px solid #ddd' : 'none'}>
        <Menu.MenuButton
          icon={icon}
          title={`Add ${item.label} query`}
          iconTitle={open ? 'Collapse' : 'Expand'}
          onClick={this.onAddQuery}
          onIconClick={!nonHierarchical ? this.toggleOpen : undefined}
          menu={menu.length > 0 ? menu : null}>
          <HBox flexGrow={1} alignItems="center">
            <VBox flexGrow={1} flexShrink={1}>
              <Label label={item.label} />
            </VBox>
            {item.fromQuery && <TagLabel marginLeft="auto">Query</TagLabel>}
          </HBox>
        </Menu.MenuButton>
        {!nonHierarchical &&
          open &&
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

function AddQueryMenuButtonMenu({
  onAdd,
  onNavigate,
  onAggregate,
  context,
  path,
  noNavigate,
}) {
  let navigation = qn.getNavigation(context, false);
  return (
    <VBox marginLeft={15} borderLeft={css.border(1, '#ddd')}>
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
