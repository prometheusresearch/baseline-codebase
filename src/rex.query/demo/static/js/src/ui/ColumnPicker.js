/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {QueryBuilderActions} from '../QueryBuilder';

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';

import * as t from '../model/Type';

type ColumnPickerProps = {
  pointer: QueryPointer<Query>;
  options: Array<{label: string; value: string, type: ?t.Type}>;
  selected: Array<string>;
  onSelect: (field: string) => *;
};

let ColumnPickerGroupTitle = style(VBox, {
  base: {
    fontSize: '8pt',
    fontWeight: 200,
    padding: 5,
    paddingLeft: 10,
    color: '#888',
  }
});

function ColumnPickerGroup({title, children}) {
  return (
    <VBox>
      <ColumnPickerGroupTitle>
        {title}
      </ColumnPickerGroupTitle>
      <VBox>
        {children}
      </VBox>
    </VBox>
  );
}

export default class ColumnPicker extends React.Component<*, ColumnPickerProps, *> {

  state: {
    searchTerm: ?string;
  };

  context: {
    actions: QueryBuilderActions
  };

  static contextTypes = {actions: React.PropTypes.object};

  state = {
    searchTerm: null,
  };

  render() {
    let {options, selected, onSelect} = this.props;
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
      let button = (
        <ColumnPickerButton
          key={column.value}
          column={column}
          onSelect={onSelect}
          selected={selected.indexOf(column.value) > -1}
          />
      );
      let type = column.type ? t.atom(column.type) : null;
      if (type && type.name === 'entity') {
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
        <VBox paddingV={20}>
          <ColumnButtonBase icon="＋" onClick={this.onAddDefine}>
            Define new attribute
          </ColumnButtonBase>
        </VBox>
        {entityGroup.length > 0 &&
          <VBox paddingBottom={10}>
            <ColumnPickerGroup title="Entity">
              {entityGroup}
            </ColumnPickerGroup>
          </VBox>}
        {fieldGroup.length > 0 &&
          <VBox>
            <ColumnPickerGroup title="Field">
              {fieldGroup}
            </ColumnPickerGroup>
          </VBox>}
      </VBox>
    );
  }

  onAddDefine = (e: UIEvent) => {
    e.stopPropagation();
    this.context.actions.addDefine(this.props.pointer);
  };

  onSearchTerm = (e: UIEvent) => {
    let target: {value: string} = (e.target: any);
    this.setState({searchTerm: target.value === '' ? null : target.value});
  };
}

let ColumnButtonRoot = style(HBox, {
  base: {
    cursor: 'pointer',
    fontSize: '10pt',
    fontWeight: 200,
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottom: css.border(1, '#eee'),
    userSelect: 'none',
    firstOfType: {
      borderTop: css.border(1, '#eee'),
    },
    hover: {
      background: '#fafafa',
    }
  },
  selected: {
    color: '#1f85f5',
  }
});

function ColumnButtonBase(props) {
  let {icon, selected, children, onIconClick, onClick} = props;
  return (
    <ColumnButtonRoot onClick={onClick} variant={{selected}}>
      <VBox
        onClick={onIconClick}
        width={15}
        paddingRight={20}
        justifyContent="flex-start">
        {icon}
      </VBox>
      {children}
    </ColumnButtonRoot>
  );
}

class ColumnPickerButton extends React.Component {

  props: {
    selected: boolean;
    column: {label: string; value: string, type: ?t.Type};
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
      <ColumnButtonBase
        selected={selected}
        icon={selected && '✓'}
        onClick={this.onSelect}>
        <VBox grow={1}>
          {column.label}
        </VBox>
        {column.type &&
          <ColumnType alignSelf="center">
            {t.toString(column.type)}
          </ColumnType>}
      </ColumnButtonBase>
    );
  }
}

let ColumnType = style(HBox, {
  base: {
    fontFamily: 'Menlo, Monaco, monospace',
    fontSize: '7pt',
    color: '#888',
  }
});
