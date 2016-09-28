/**
 * @flow
 */

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';

type ColumnPickerProps = {
  options: Array<{label: string; value: string}>;
  selected: Array<string>;
  onSelect: (field: string) => *;
};

export default class ColumnPicker extends React.Component<*, ColumnPickerProps, *> {

  render() {
    let {options, selected, onSelect} = this.props;
    let items = options.map(column =>
      <ColumnPickerButton
        key={column.value}
        column={column}
        onSelect={onSelect}
        selected={selected.indexOf(column.value) > -1}
        />
    );
    return (
      <VBox>
        <VBox padding={10}>
          <ReactUI.Input
            placeholder="Search columns…"
            />
        </VBox>
        <VBox paddingBottom={20}>
          <ColumnButtonBase icon="＋">
            Define new attribute
          </ColumnButtonBase>
        </VBox>
        <VBox>{items}</VBox>
      </VBox>
    );
  }
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
    column: {label: string; value: string};
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
        {column.label}
      </ColumnButtonBase>
    );
  }
}
