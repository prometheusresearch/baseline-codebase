/**
 * @flow
 */

import type {QueryPointer, Type, TypeCardinality, Query, Context} from '../model';
import type {Actions} from '../state';

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';

import PlusIcon from './PlusIcon';
import * as feature from '../feature';
import * as t from '../model/Type';
import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import {MenuGroup, MenuButton, MenuButtonSecondary} from './menu';

type Navigation = {
  type: 'record' | 'attribute';
  card: TypeCardinality;
  value: string;
  label: string;
  context: Context;
  pointer?: QueryPointer<>;
  groupBy?: boolean;
};

type ColumnPickerProps = {
  pointer: QueryPointer<Query>;
  onSelect: (payload: {path: string}) => *;
  onSelectRemove: (payload: {path: string, pointer: QueryPointer<>}) => *;
};

export default class ColumnPicker extends React.Component<*, ColumnPickerProps, *> {

  state: {
    searchTerm: ?string;
  };

  context: {
    actions: Actions;
  };

  static contextTypes = {actions: React.PropTypes.object};

  state = {
    searchTerm: null,
  };

  render() {
    let {
      pointer,
      onSelect,
      onSelectRemove,
    } = this.props;
    let {type} = pointer.query.context;
    let active = getNavigationPointerMap(pointer);
    let options = pointer.query.name === 'select' || type.name === 'invalid'
      ? getNavigation(pointer, pointer.query.context.prev.type)
      : getNavigation(pointer, pointer.query.context.type);
    let {searchTerm} = this.state;
    if (searchTerm != null) {
      let searchTermRe = new RegExp(searchTerm, 'ig');
      options = options.filter(column => {
        return searchTermRe.test(column.label) || searchTermRe.test(column.value);
      });
    }
    let entityList = [];
    let queryList = [];
    let attributeList = [];
    let groupByAttributeList = [];
    options.forEach(column => {
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
      <VBox>
        <VBox padding={10}>
          <ReactUI.Input
            placeholder="Search columns…"
            value={searchTerm === null ? '' : searchTerm}
            onChange={this.onSearchTerm}
            />
        </VBox>
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
      </VBox>
    );
  }

  onDefine = (nav: Navigation) => {
    this.context.actions.appendDefine({
      pointer: this.props.pointer,
      select: true,
      path: [nav.value],
    });
  };

  onAggregate = (_aggregateName: string) => {
    this.context.actions.appendAggregate({
      pointer: this.props.pointer
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

  onSearchTerm = (e: UIEvent) => {
    let target: {value: string} = (e.target: any);
    this.setState({searchTerm: target.value === '' ? null : target.value});
  };
}

class ColumnPickerButton extends React.Component {

  props: {
    pointer?: QueryPointer<>;
    column: Navigation;
    onSelect: (payload: {path: string}) => *;
    onNavigate: (payload: {path: string}) => *;
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

  render() {
    let {column, pointer, disabled} = this.props;
    return (
      <MenuButton
        disabled={disabled}
        selected={pointer != null}
        icon={pointer != null ? '✓' : null}
        menu={
          feature.ENABLE_ATTRIBUTE_CONTEXT_MENU && !disabled && [
            column.type === 'record' &&
              <MenuButtonSecondary
                icon={<PlusIcon />}
                onClick={this.onAddQuery}
                key="define">
                Add {column.label}
              </MenuButtonSecondary>,
            <MenuButtonSecondary
              icon="⇩"
              onClick={this.onNavigate}
              key="navigate">
              Focus {column.label}
            </MenuButtonSecondary>,
          ]
        }
        onClick={this.onSelect}>
        <VBox grow={1} justifyContent="center">
          {column.card === 'seq' ? '# ' : ''}{column.label}
        </VBox>
      </MenuButton>
    );
  }
}

function getNavigation(pointer: QueryPointer<>, type: Type): Array<Navigation> {
  let {context} = pointer.query;
  let {scope, domain} = context;
  let navigation = [];

  let contextAtQuery = {
    ...context,
    type: t.regType(type),
  };

  // Collect paths from an input type
  if (type.name === 'void') {
    for (let k in domain.entity) {
      if (domain.entity.hasOwnProperty(k)) {
        let navQuery = q.inferQueryType(contextAtQuery, q.navigate(k));
        navigation.push({
          type: 'record',
          card: 'seq',
          value: k,
          label: domain.entity[k].title,
          context: navQuery.context,
        });
      }
    }
  } else if (type.name === 'record') {
    let attribute = t.recordAttribute(type);
    for (let k in attribute) {
      if (attribute.hasOwnProperty(k)) {
        let navQuery = q.inferQueryType(contextAtQuery, q.navigate(k));
        let type = attribute[k].type;
        navigation.push({
          type: type.name === 'record'
            ? 'record'
            : 'attribute',
          card: type.card,
          value: k,
          label: attribute[k].title || k,
          context: navQuery.context,
          groupBy: attribute[k].groupBy,
        });
      }
    }
  }

  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      let navQuery = q.inferQueryType(contextAtQuery, scope[k].query);
      navigation.push({
        type: 'record',
        card: type.card,
        value: k,
        label: k,
        context: navQuery.context,
      });
    }
  }

  return navigation;
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
