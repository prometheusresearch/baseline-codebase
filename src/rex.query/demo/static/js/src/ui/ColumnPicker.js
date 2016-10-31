/**
 * @flow
 */

import type {QueryPointer, Type, Query, Context} from '../model';
import type {Actions} from '../state';

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';

import * as t from '../model/Type';
import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import {MenuGroup, MenuButton} from './menu';

type Navigation = {
  value: string;
  label: string;
  context: Context;
  pointer?: QueryPointer<>;
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
    let {pointer, onSelect, onSelectRemove} = this.props;
    let {type} = pointer.query.context;
    let active = getNavigationPointerMap(pointer);
    let options = pointer.query.name === 'select' || type == null
      ? getNavigation(pointer, pointer.query.context.inputType)
      : getNavigation(pointer, pointer.query.context.type);
    let {searchTerm} = this.state;
    if (searchTerm != null) {
      let searchTermRe = new RegExp(searchTerm, 'ig');
      options = options.filter(column => {
        return searchTermRe.test(column.label) || searchTermRe.test(column.value);
      });
    }
    let entityGroup = [];
    let fieldGroup = [];
    options.forEach(column => {
      let pointer = active[column.value];
      let type = t.maybeAtom(column.context.type);
      let isEntity = type && type.name === 'entity';
      let button = (
        <ColumnPickerButton
          key={column.value}
          column={column}
          pointer={pointer}
          onSelect={onSelect}
          onSelectRemove={onSelectRemove}
          actions={this.context.actions}
          />
      );
      if (isEntity) {
        entityGroup.push(button);
      } else {
        fieldGroup.push(button);
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
        <MenuGroup paddingV={20}>
          <MenuButton icon="＋" onClick={this.onAddDefine}>
            Define new attribute
          </MenuButton>
        </MenuGroup>
        {entityGroup.length > 0 &&
          <VBox paddingBottom={10}>
            <MenuGroup
              title={
                type == null || type.name === 'void'
                  ? 'Entities'
                  : 'Relationships'
              }>
              {entityGroup}
            </MenuGroup>
          </VBox>}
        {fieldGroup.length > 0 &&
          <VBox>
            <MenuGroup title="Attributes">
              {fieldGroup}
            </MenuGroup>
          </VBox>}
      </VBox>
    );
  }

  onAddDefine = (e: UIEvent) => {
    e.stopPropagation();
    this.context.actions.appendDefine({
      pointer: this.props.pointer,
      select: true,
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
    column: {label: string; value: string, context: Context};
    onSelect: (payload: {path: string}) => *;
    onSelectRemove: (payload: {path: string, pointer: QueryPointer<>}) => *;
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

  render() {
    let {column, pointer} = this.props;
    return (
      <MenuButton
        selected={pointer != null}
        icon={pointer != null ? '✓' : null}
        onClick={this.onSelect}>
        <VBox grow={1} justifyContent="center">
          {column.label}
        </VBox>
      </MenuButton>
    );
  }
}

function getNavigation(pointer: QueryPointer<>, type: ?Type): Array<Navigation> {
  let {context} = pointer.query;
  let {scope, domain} = context;
  let navigation = [];

  let contextAtQuery = {
    ...context,
    type: t.maybeAtom(type),
  };

  // Collect paths from an input type
  if (type != null) {
    let baseType = t.atom(type);
    if (baseType.name === 'void') {
      for (let k in domain.entity) {
        if (domain.entity.hasOwnProperty(k)) {
          let navQuery = q.inferQueryType(contextAtQuery, q.navigate(k));
          navigation.push({
            value: k,
            label: domain.entity[k].title,
            context: navQuery.context,
          });
        }
      }
    } else if (baseType.name === 'entity') {
      let attribute = domain.entity[baseType.entity].attribute;
      for (let k in attribute) {
        if (attribute.hasOwnProperty(k)) {
          let navQuery = q.inferQueryType(contextAtQuery, q.navigate(k));
          navigation.push({
            value: k,
            label: attribute[k].title,
            context: navQuery.context,
          });
        }
      }
    } else if (baseType.name === 'record') {
      for (let k in baseType.fields) {
        if (baseType.fields.hasOwnProperty(k)) {
          let navQuery = q.inferQueryType(contextAtQuery, q.navigate(k));
          navigation.push({
            value: k,
            label: k,
            context: navQuery.context,
          });
        }
      }
    }
  }

  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      let navQuery = q.inferQueryType(contextAtQuery, scope[k]);
      navigation.push({
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
