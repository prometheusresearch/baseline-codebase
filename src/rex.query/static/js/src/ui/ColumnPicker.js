/**
 * @flow
 */

import type {QueryNavigation, QueryPointer, QueryPipeline, Query} from '../model';
import type {Actions} from '../state';
import type {SearchCallback} from './Search';

import React from 'react';
import {VBox, HBox} from 'react-stylesheet';

import {IconPlus} from './Icon';
import TagLabel from './TagLabel';
import Label from './Label';
import * as feature from '../feature';
import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import {MenuGroup, MenuButton, MenuButtonSecondary} from './menu';
import NavigationMenu from './NavigationMenu';

type ColumnPickerProps = {
  pointer: QueryPointer<Query>;
  onSelect: (payload: {path: string}) => *;
  onSelectRemove: (payload: {path: string, pointer: QueryPointer<>}) => *;
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
    let {pointer: {query}, onSearch} = this.props;
    let context = query.name === 'select' || query.context.type.name === 'invalid'
      ? query.context.prev
      : query.context;
    return (
      <NavigationMenu onSearch={onSearch} context={context}>
        <this.NavigationMenuContents {...this.props} />
      </NavigationMenu>
    );

  }

  NavigationMenuContents = (props: ColumnPickerProps & {navigation: Map<string, QueryNavigation>}) => {
    let {
      pointer,
      navigation,
      onSelect,
      onSelectRemove,
    } = props;

    let {type} = pointer.query.context;
    let active = getNavigationPointerMap(pointer);
    let entityList = [];
    let queryList = [];
    let attributeList = [];
    let groupByAttributeList = [];

    navigation.forEach(column => {
      let pointer = active[column.value];
      let button = (
        <ColumnPickerButton
          key={column.value}
          disabled={column.groupBy}
          column={column}
          pointer={pointer}
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
      pointer: this.props.pointer,
      select: true,
      path: [nav.value],
    });
  };

  onAggregate = (payload: {path: string}) => {
    let domain = this.props.pointer.query.context.domain;
    let pipeline = qp.prev(this.props.pointer);
    this.context.actions.appendDefineAndAggregate({
      pointer: ((pipeline: any): QueryPointer<QueryPipeline>),
      path: [payload.path],
      aggregate: domain.aggregate.count,
    });
  };

  onFilter = () => {
    this.context.actions.appendFilter({pointer: this.props.pointer});
  };

  onNavigate = (payload: {path: string}) => {
    let p = getPipelineInsertionPoint(this.props.pointer);
    this.context.actions.appendNavigate({
      pointer: p,
      path: [payload.path],
    });
  };

  onAddQuery = (payload: {path: string}) => {
    let p = getPipelineInsertionPoint(this.props.pointer);
    this.context.actions.appendDefine({
      pointer: p,
      select: true,
      path: [payload.path],
    });
  };

}

class ColumnPickerButton extends React.Component {

  props: {
    pointer?: QueryPointer<>;
    column: QueryNavigation;
    onSelect: (payload: {path: string}) => *;
    onNavigate: (payload: {path: string}) => *;
    onAggregate: (payload: {path: string}) => *;
    onAddQuery: (payload: {path: string}) => *;
    onSelectRemove: (payload: {path: string, pointer: QueryPointer<>}) => *;
    disabled: boolean;
    actions: Actions;
  };

  onSelect = (e: UIEvent) => {
    e.stopPropagation();
    let {onSelect, onSelectRemove, column, pointer} = this.props;
    if (pointer != null) {
      onSelectRemove({path: column.value, pointer});
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
    let {column, pointer, disabled} = this.props;
    let title;
    if (pointer != null) {
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
        selected={pointer != null}
        icon={pointer != null ? '✓' : null}
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

function getNavigationPointerMap(pointer: QueryPointer<>) {
  // Now we show column picker on navigate nodes, this is why we do this hack...
  let pointerPrev = qp.prev(pointer);
  if (pointerPrev && pointerPrev.query.name === 'pipeline') {
    return getNavigationPointerMapImpl(pointerPrev);
  } else {
    return getNavigationPointerMapImpl(pointer);
  }
}

function getNavigationPointerMapImpl(
  pointer: QueryPointer<>
): {[path: string]: QueryPointer<>} {
  const noNavigation = {};
  return q.transformQuery(pointer.query, {

    pipeline: query => {
      if (query.pipeline.length === 0) {
        return {};
      } else if (query.pipeline.length === 1) {
        return getNavigationPointerMapImpl(qp.select(pointer, ['pipeline', 0]));
      } else {
        let navigation = {};
        for (let i = 0; i < query.pipeline.length; i++) {
          // FIXME: this is silly
          navigation = getNavigationPointerMapImpl(qp.select(pointer, ['pipeline', i]));
        }
        return navigation;
      }
    },

    navigate: query => {
      return {
        [query.path]: pointer,
      };
    },

    select: query => {
      let navigation = {};
      for (let name in query.select) {
        if (!query.select.hasOwnProperty(name)) {
          continue;
        }
        navigation[name] = qp.select(pointer, ['select', name]);
      }
      return navigation;
    },

    otherwise: _query => {
      return noNavigation;
    },
  });
}

function getPipelineInsertionPoint(pointer: QueryPointer<>) {
  let p = qp.prev(pointer);
  if (p == null || p.query.name !== 'pipeline') {
    return pointer;
  }
  return qp.select(p, ['pipeline', p.query.pipeline.length - 2]);
}
