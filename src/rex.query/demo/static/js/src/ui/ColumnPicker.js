/**
 * @flow
 */

import type {Query, Context} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {Actions} from '../state';

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';
import {style} from 'react-stylesheet';

import * as t from '../model/Type';
import * as q from '../model/Query';
import {MenuGroup, MenuButton} from './menu';

type Navigation = {
  value: string;
  label: string;
  context: Context;
};

type ColumnPickerProps = {
  pointer: QueryPointer<Query>;
  before?: boolean;
  selected: Array<string>;
  onSelect: (field: string) => *;
  allowNested?: boolean;
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
    let {pointer, before, allowNested, selected: selectedList, onSelect} = this.props;
    let options = before
      ? getNavigationBefore(pointer.query.context)
      : getNavigationAfter(pointer.query.context);
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
      let selected = selectedList.indexOf(column.value) > -1;
      let type = t.maybeAtom(column.context.type);
      let isEntity = type && type.name === 'entity';
      let button = (
        <ColumnPickerButton
          key={column.value}
          column={column}
          onSelect={onSelect}
          selected={selected}
          />
      );
      if (allowNested && isEntity && selected) {
        button = (
          <VBox key={column.value}>
            {button}
            <VBox paddingLeft={10}>
              <ColumnPickerGroup
                allowNested={allowNested}
                context={column.context}
                selected={selected}
                onSelect={onSelect}
                />
            </VBox>
          </VBox>
        );
      }
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
            <MenuGroup title="Entity">
              {entityGroup}
            </MenuGroup>
          </VBox>}
        {fieldGroup.length > 0 &&
          <VBox>
            <MenuGroup title="Field">
              {fieldGroup}
            </MenuGroup>
          </VBox>}
      </VBox>
    );
  }

  onAddDefine = (e: UIEvent) => {
    e.stopPropagation();
    this.context.actions.appendDefine({pointer: this.props.pointer});
  };

  onSearchTerm = (e: UIEvent) => {
    let target: {value: string} = (e.target: any);
    this.setState({searchTerm: target.value === '' ? null : target.value});
  };
}

class ColumnPickerButton extends React.Component {

  props: {
    selected: boolean;
    column: {label: string; value: string, context: Context};
    onSelect: (value: string) => *;
  };

  onSelect = (e: UIEvent) => {
    e.stopPropagation();
    let {onSelect, column} = this.props;
    onSelect(column.value);
  };

  render() {
    let {column, selected} = this.props;
    return (
      <MenuButton
        selected={selected}
        icon={selected ? '✓' : null}
        onClick={this.onSelect}>
        <VBox grow={1}>
          {column.label}
        </VBox>
        {column.context.type &&
          <ColumnType alignSelf="center">
            {t.toString(column.context.type)}
          </ColumnType>}
      </MenuButton>
    );
  }
}

function ColumnPickerGroup({context, onSelect, allowNested}) {
  let selected = false;
  let buttons = getNavigationAfter(context).map(column => {
    let type = t.maybeAtom(column.context.type);
    let isEntity = type && type.name === 'entity';
    let button = (
      <ColumnPickerButton
        key={column.value}
        column={column}
        onSelect={onSelect}
        selected={selected}
        />
    );
    if (allowNested && isEntity && selected) {
      button = (
        <VBox key={column.value}>
          {button}
          <VBox paddingLeft={10}>
            <ColumnPickerGroup
              allowNested={allowNested}
              context={column.context}
              selected={selected}
              onSelect={onSelect}
              />
          </VBox>
        </VBox>
      );
    }
    return button;
  });
  return <VBox>{buttons}</VBox>
}

let ColumnType = style(HBox, {
  base: {
    fontFamily: 'Menlo, Monaco, monospace',
    fontSize: '7pt',
    color: '#888',
  }
});

function getNavigationBefore(context: Context): Array<Navigation> {
  return getNavigation(context, context.inputType);
}

function getNavigationAfter(context: Context): Array<Navigation> {
  return getNavigation(context, context.type);
}

function getNavigation(context, type) {
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
          navigation.push({
            value: k,
            label: domain.entity[k].title,
            context: q.inferTypeStep(contextAtQuery, q.navigate(k)).context,
          });
        }
      }
    } else if (baseType.name === 'entity') {
      let attribute = domain.entity[baseType.entity].attribute;
      for (let k in attribute) {
        if (attribute.hasOwnProperty(k)) {
          navigation.push({
            value: k,
            label: attribute[k].title,
            context: q.inferTypeStep(contextAtQuery, q.navigate(k)).context,
          });
        }
      }
    }
  }

  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      navigation.push({
        value: k,
        label: k,
        context: q.inferTypeStep(contextAtQuery, scope[k]).context,
      });
    }
  }

  return navigation;
}
