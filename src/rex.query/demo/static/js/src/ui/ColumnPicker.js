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
import * as css from 'react-stylesheet/css';

import * as FieldList from '../state/FieldList';
import * as t from '../model/Type';
import * as nav from '../model/navigation';
import {MenuGroup, MenuButton} from './menu';
import PlusIcon from './PlusIcon';
import * as QueryButton from './QueryButton';
import * as QueryPane from './QueryPane';


type ColumnPickerProps = {
  pointer: QueryPointer<Query>;
  before?: boolean;
  selected: FieldList.FieldList;
  onSelect: (path: Array<string>) => *;
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
      ? nav.getNavigationBefore(pointer.query.context)
      : nav.getNavigationAfter(pointer.query.context);
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
      let selected = FieldList.findBy(selectedList, column.value);
      let type = t.maybeAtom(column.context.type);
      let isEntity = type && type.name === 'entity';
      let button = (
        <ColumnPickerButton
          key={column.value}
          path={[column.value]}
          column={column}
          onSelect={onSelect}
          selected={selected != null}
          actions={this.context.actions}
          />
      );
      if (allowNested && isEntity && selected != null) {
        button = (
          <VBox key={column.value}>
            {button}
            <VBox paddingLeft={15}>
              <ColumnPickerGroup
                path={[column.value]}
                allowNested={allowNested}
                context={column.context}
                selected={selected}
                onSelect={onSelect}
                actions={this.context.actions}
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

  state: {
    hover: boolean;
  };

  props: {
    selected: boolean;
    path: Array<string>;
    column: {label: string; value: string, context: Context};
    onSelect: (path: Array<string>) => *;
    actions: Actions;
  };

  state = {
    hover: false,
  };

  onSelect = (e: UIEvent) => {
    e.stopPropagation();
    let {onSelect, path} = this.props;
    onSelect(path);
  };

  onHover = () => {
    this.setState({hover: true});
  };

  onHoverOff = () => {
    this.setState({hover: false});
  };

  onNavigate = (e: UIEvent) => {
    e.stopPropagation();
    let {actions, path} = this.props;
    actions.appendNavigate({path, select: false});
  };

  onDefine = (e: UIEvent) => {
    e.stopPropagation();
    let {actions, path} = this.props;
    actions.appendDefine({path, select: false});
  };

  render() {
    let {column, selected} = this.props;
    let {hover} = this.state;
    let buttonGroup = hover
      ?  <HBox>
          <QueryPane.NavigatePane>
            <QueryButton.NavigateButton
              height="100%"
              icon={<PlusIcon />}
              onClick={this.onNavigate}>
              Nav
            </QueryButton.NavigateButton>
          </QueryPane.NavigatePane>
          <QueryPane.DefinePane>
            <QueryButton.DefineButton
              height="100%"
              icon={<PlusIcon />}
              onClick={this.onDefine}>
              Def
            </QueryButton.DefineButton>
          </QueryPane.DefinePane>
        </HBox>
      : column.context.type
      ? <ColumnType alignSelf="center">
          {t.toString(column.context.type)}
        </ColumnType>
      : null;
    return (
      <MenuButton
        onMouseEnter={this.onHover}
        onMouseLeave={this.onHoverOff}
        selected={selected}
        icon={selected ? '✓' : null}
        buttonGroup={buttonGroup}
        onClick={this.onSelect}>
        <VBox grow={1} justifyContent="center">
          {column.label}
        </VBox>
      </MenuButton>
    );
  }
}

function ColumnPickerGroup({
  actions, path, selected: selectedList, context, onSelect, allowNested
}) {
  let buttons = nav.getNavigationAfter(context).map(column => {
    let selected = FieldList.findBy(selectedList, column.value);
    let type = t.maybeAtom(column.context.type);
    let isEntity = type && type.name === 'entity';
    let button = (
      <ColumnPickerButton
        path={path.concat(column.value)}
        key={column.value}
        column={column}
        onSelect={onSelect}
        selected={selected != null}
        actions={actions}
        />
    );
    if (allowNested && isEntity && selected) {
      button = (
        <VBox key={column.value}>
          {button}
          <VBox paddingLeft={15}>
            <ColumnPickerGroup
              path={path.concat(column.value)}
              allowNested={allowNested}
              context={column.context}
              selected={selected}
              onSelect={onSelect}
              actions={actions}
              />
          </VBox>
        </VBox>
      );
    }
    return button;
  });
  return <ColumnPickerGroupRoot>{buttons}</ColumnPickerGroupRoot>;
}

let ColumnPickerGroupRoot = style(VBox, {
  base: {
    borderLeft: css.border(1, '#eee'),
  }
});

let ColumnType = style(HBox, {
  displayName: 'ColumnType',
  base: {
    paddingLeft: 10,
    paddingRight: 10,
    fontFamily: 'Menlo, Monaco, monospace',
    fontSize: '7pt',
    color: '#888',
  }
});

