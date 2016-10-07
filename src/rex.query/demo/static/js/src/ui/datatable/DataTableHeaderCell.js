/**
 * @flow
 */

import type {ColumnField} from './DataTable';

import React from 'react'
import {HBox} from '@prometheusresearch/react-box';
import EllipsisIcon from 'react-icons/lib/fa/ellipsis-v';
import {style} from 'react-stylesheet';
import * as css from 'react-stylesheet/css';

type DataTableHeaderCellProps = {
  column: ColumnField<*>;
  onClick?: () => *;
  style: Object;
};

export default function DataTableHeaderCell(props: DataTableHeaderCellProps) {
  const {column, onClick, style} = props;
  return (
    <DataTableHeaderCellRoot
      style={style}
      onClick={onClick}>
      <DataTableHeaderCellLabel title={column.field.label}>
        {column.field.label}
      </DataTableHeaderCellLabel>
      <DataTableHeaderCellMenu>
        <EllipsisIcon />
      </DataTableHeaderCellMenu>
    </DataTableHeaderCellRoot>
  );
}

export let DataTableHeaderCellRoot = style('div', {
  displayName: 'DataTableHeaderCellRoot',
  base: {
    position: 'relative',
    minWidth: 0,

    paddingRight: 10,
    paddingLeft: 10,

    borderRight: css.border(1, '#ccc'),
  }
});

export let DataTableHeaderCellLabel = style('span', {
  displayName: 'DataTableHeaderCellLabel',
  base: {
    userSelect: 'none',
    cursor: 'default',
    display: css.display.inlineBlock,
    maxWidth: '100%',
    whiteSpace: css.whiteSpace.nowrap,
    textOverflow: css.textOverflow.ellipsis,
    overflow: css.overflow.hidden,
    position: css.position.absolute,
    bottom: 5,
    paddingRight: 20,
  }
});

export let DataTableHeaderCellMenu = style(HBox, {
  base: {
    color: '#ccc',
    cursor: 'pointer',

    position: 'absolute',
    bottom: 7,
    right: 4,

    hover: {
      color: 'currentColor',
    }
  }
});
