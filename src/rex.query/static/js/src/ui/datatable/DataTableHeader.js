/**
 * @flow
 **/

import type {ColumnConfig, ColumnField} from './DataTable';

import React from 'react'
import {VBox, HBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';
import * as css from 'react-stylesheet/css';

import computeColumnStyle from './computeColumnStyle';
import DataTableHeaderCell from './DataTableHeaderCell';

type DataTableHeaderProps = {
  columns: ColumnConfig<*>;
  columnWidgetByDataKey: {[dataKey: string]: number};
  height: number;
  width: number;
  scrollbarWidth: number;
  onColumnResize?: (resize: {dataKey: Array<string>; width: number}) => *;
  onColumnClick?: (column: ColumnField<*>) => *;
};

export default function DataTableHeader(props: DataTableHeaderProps) {
  let {
    width, height,
    scrollbarWidth,
    onColumnClick, onColumnResize,
    columns, columnWidgetByDataKey,
  } = props;
  return (
    <DataTableHeaderRow
      style={{
        height: height * columns.size.height,
        width,
        paddingRight: scrollbarWidth,
      }}>
      <DataTableHeaderItem
        columns={columns}
        columnWidgetByDataKey={columnWidgetByDataKey}
        height={height}
        onClick={onColumnClick}
        onResize={onColumnResize}
        />
    </DataTableHeaderRow>
  );
}

function DataTableHeaderItem({
  columns, columnWidgetByDataKey,
  onClick, onResize,
  height, grow = 1
}) {
  if (columns.type === 'stack') {
    return (
      <DataTableHeaderStack height={height * columns.size.height} grow={grow}>
        {columns.stack.map((columns, idx) =>
          columns.type === 'field' ?
          <DataTableHeaderGroup
            height={height * columns.size.height}
            grow={1}
            width="100%"
            key={idx}>
            <DataTableHeaderItem
              onClick={onClick}
              onResize={onResize}
              height={height}
              flexGrow={1}
              columns={columns}
              columnWidgetByDataKey={columnWidgetByDataKey}
              />
          </DataTableHeaderGroup> :
          <DataTableHeaderItem
            onClick={onClick}
            onResize={onResize}
            height={height}
            key={idx}
            columns={columns}
            columnWidgetByDataKey={columnWidgetByDataKey}
            />)}
      </DataTableHeaderStack>
    );
  } else if (columns.type === 'group') {
    return (
      <DataTableHeaderGroup grow={grow} height={height * columns.size.height}>
        {columns.group.map((columns, idx) =>
          <DataTableHeaderItem
            onClick={onClick}
            onResize={onResize}
            key={idx}
            height={height}
            grow={columns.size.width}
            columns={columns}
            columnWidgetByDataKey={columnWidgetByDataKey}
            />)}
      </DataTableHeaderGroup>
    );
  } else if (columns.type === 'field') {
    let dataKey = columns.field.dataKey.join('__');
    let width = columnWidgetByDataKey[dataKey];
    const style = computeColumnStyle(columns.field, {
      flexGrow: grow,
      width,
    })
    if (columns.field.headerCellRenderer) {
      return columns.field.headerCellRenderer({
        column: columns,
        onClick: onClick ? onClick.bind(null, columns) : onClick,
        style: style,
      });
    } else {
      return (
        <DataTableHeaderCell
          column={columns}
          style={style}
          onClick={onClick}
          onResize={onResize}
          />
      );
    }
  }

}

let DataTableHeaderStack = style(VBox, {
  displayName: 'DataTableHeaderStack',
  base: {
    height: '100%',
    flexGrow: 1,
    overflow: 'visible',
  }
});

let DataTableHeaderGroup = style(HBox, {
  displayName: 'DataTableHeaderGroup',
  base: {
    borderBottom: css.border(1, '#ccc'),
    overflow: 'visible',
  }
});

let DataTableHeaderRow = style('div', {
  displayName: 'DataTableHeaderRow',
  base: {
    marginBottom: 2,
    boxShadow: css.boxShadow(0, 0, 3, 0, '#666'),
    fontSize: '10pt',
    fontWeight: 400,
    color: '#444',
    position: css.position.relative,
    textTransform: css.textTransform.none,

    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  }
});

