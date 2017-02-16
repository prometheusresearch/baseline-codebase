/**
 * @flow
 */

import type {QueryNavigation, QueryPipeline} from '../model';
import type {Actions} from '../state';
import type {SearchCallback} from './Search';

import React from 'react';
import {VBox, HBox} from 'react-stylesheet';

import {IconPlus} from './Icon';
import TagLabel from './TagLabel';
import Label from './Label';
import * as feature from '../feature';
import {getInsertionPoint} from '../model/QueryOperation';
import {MenuGroup, MenuButton, MenuButtonSecondary} from './menu';
import NavigationMenu from './NavigationMenu';

type ColumnPickerProps = {
  query: QueryPipeline;
  onSelect: (payload: {path: string}) => *;
  onSelectRemove: (payload: {path: string, query: QueryPipeline}) => *;
  onSearch: SearchCallback;
};

export default class ColumnPicker extends React.Component<*, ColumnPickerProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {
    actions: React.PropTypes.object
  };

  render() {
    let {query, onSearch} = this.props;
    let context = query.context.type.name === 'invalid'
      ? query.context.prev
      : getInsertionPoint(query).context;
    return (
      <NavigationMenu onSearch={onSearch} context={context}>
        <this.NavigationMenuContents {...this.props} />
      </NavigationMenu>
    );

  }

  NavigationMenuContents = (props: ColumnPickerProps & {navigation: Map<string, QueryNavigation>}) => {
    let {
      query,
      navigation,
      onSelect,
      onSelectRemove,
    } = props;

    let {type} = query.context;
    let active = getNavigationIndex(query);
    let entityList = [];
    let queryList = [];
    let attributeList = [];
    let groupByAttributeList = [];

    navigation.forEach(column => {
      let query = active[column.value];
      let button = (
        <ColumnPickerButton
          key={column.value}
          disabled={column.groupBy}
          column={column}
          query={query}
          onSelect={onSelect}
          onSelectRemove={onSelectRemove}
          onNavigate={this.onNavigate}
          onAddQuery={this.onAddQuery}
          onAggregate={this.onAggregate}
          actions={this.context.actions}
          />
      );
      if (column.groupBy) {
        groupByAttributeList.push(button);
      } else if (column.type === 'record') {
        queryList.push(button);
        entityList.push(column);
      } else {
        attributeList.push(button);
      }
    });
    return (
      <VBox paddingBottom={10}>
        {groupByAttributeList.length > 0 &&
          <VBox paddingBottom={10}>
            <MenuGroup
              title="Group by columns">
              {groupByAttributeList}
            </MenuGroup>
          </VBox>}
        {queryList.length > 0 &&
          <VBox paddingBottom={10}>
            <MenuGroup
              title={
                type.name === 'invalid' || type.name === 'void'
                  ? 'Entities'
                  : 'Relationships'
              }>
              {queryList}
            </MenuGroup>
          </VBox>}
        {attributeList.length > 0 &&
          <VBox paddingBottom={10}>
            <MenuGroup title="Attributes">
              {attributeList}
            </MenuGroup>
          </VBox>}
      </VBox>
    );
  };

  onDefine = (nav: QueryNavigation) => {
    this.context.actions.appendDefine({
      at: this.props.query,
      select: true,
      path: [nav.value],
    });
  };

  onAggregate = (payload: {path: string}) => {
    let domain = this.props.query.context.domain;
    this.context.actions.appendDefineAndAggregate({
      at: this.props.query,
      path: [payload.path],
      aggregate: domain.aggregate.count,
    });
  };

  onFilter = () => {
    this.context.actions.appendFilter({at: this.props.query});
  };

  onNavigate = (payload: {path: string}) => {
    this.context.actions.appendNavigate({
      at: this.props.query,
      path: [payload.path],
    });
  };

  onAddQuery = (payload: {path: string}) => {
    this.context.actions.appendDefine({
      at: this.props.query,
      select: true,
      path: [payload.path],
    });
  };

}

class ColumnPickerButton extends React.Component {

  props: {
    query?: QueryPipeline;
    column: QueryNavigation;
    onSelect: (payload: {path: string}) => *;
    onNavigate: (payload: {path: string}) => *;
    onAggregate: (payload: {path: string}) => *;
    onAddQuery: (payload: {path: string}) => *;
    onSelectRemove: (payload: {path: string, query: QueryPipeline}) => *;
    disabled: boolean;
    actions: Actions;
  };

  onSelect = (e: UIEvent) => {
    e.stopPropagation();
    let {onSelect, onSelectRemove, column, query} = this.props;
    if (query != null) {
      onSelectRemove({path: column.value, query});
    } else {
      onSelect({path: column.value});
    }
  };

  onNavigate = () => {
    let {onNavigate, column} = this.props;
    onNavigate({path: column.value});
  };

  onAddQuery = () => {
    let {onAddQuery, column} = this.props;
    onAddQuery({path: column.value});
  };

  onAggregate = () => {
    let {onAggregate, column} = this.props;
    onAggregate({path: column.value});
  };

  render() {
    let {column, query, disabled} = this.props;
    let title;
    if (query != null) {
      title = `Hide "${column.label}" in the output`;
    } else if (column.card === 'seq') {
      title = `Show "${column.label}" in the output. The count will be shown because the attribute is plural`;
    } else {
      title = `Show "${column.label}" in the output.`;
    }
    return (
      <MenuButton
        disabled={disabled}
        title={title}
        selected={query != null}
        icon={query != null ? '✓' : null}
        menu={
          feature.ENABLE_ATTRIBUTE_CONTEXT_MENU && !disabled && [
            column.type === 'record' &&
              <MenuButtonSecondary
                icon={<IconPlus />}
                title={`Link "${column.label}" query`}
                onClick={this.onAddQuery}
                key="define">
                Link {column.label}
              </MenuButtonSecondary>,
            <MenuButtonSecondary
              icon="⇩"
              title={`Follow "${column.label}" and discard all other attributes`}
              onClick={this.onNavigate}
              key="navigate">
              Follow {column.label}
            </MenuButtonSecondary>,
            column.card === 'seq' &&
              <MenuButtonSecondary
                icon="∑"
                title={`Compute summarizations for "${column.label}"`}
                onClick={this.onAggregate}
                key="summarize">
                Summarize {column.label}
              </MenuButtonSecondary>,
          ]
        }
        onClick={this.onSelect}>
        <HBox flexShrink={1} flexGrow={1} alignItems="center">
          <Label
            label={
              column.card === 'seq' && !column.fromQuery
                ? `# ${column.label}`
                : column.label
            }
            />
          {column.fromQuery &&
            <TagLabel marginLeft="auto">
              Query
            </TagLabel>}
        </HBox>
      </MenuButton>
    );
  }
}

function getNavigationIndex(
  query: QueryPipeline
): {[key: string]: QueryPipeline} {
  const noNavigation = {};
  if (query.pipeline.length === 0) {
    return noNavigation;
  }
  const lastIndex = query.pipeline.length - 1;
  const last = query.pipeline[lastIndex];
  const navigation = {};
  if (last.name === 'navigate') {
    navigation[last.path] = query;
  } else if (last.name === 'select') {
    for (let name in last.select) {
      if (!last.select.hasOwnProperty(name)) {
        continue;
      }
      navigation[name] = last.select[name];
    }
  }
  return navigation;
}
