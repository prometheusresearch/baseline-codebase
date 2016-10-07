/**
 * @flow
 */

import type {Query, NavigateQuery} from '../model/Query';
import type {Type} from '../model/Type';
import type {ColumnConfig, ColumnField} from './datatable/DataTable';

import React from 'react';
import EllipsisIcon from 'react-icons/lib/fa/ellipsis-v';
import IconCircleO from 'react-icons/lib/fa/circle-o'
import IconCircle from 'react-icons/lib/fa/circle'
import {style} from 'react-stylesheet';
import {AutoSizer} from 'react-virtualized';

import * as ArrayUtil from '../ArrayUtil';
import * as t from '../model/Type';
import {flattenPipeline} from '../model/Query';
import {
  DataTable as DataTableBase,
  DataTableHeaderCellRoot,
  DataTableHeaderCellLabel,
  DataTableHeaderCellMenu,
  getByKey
} from './datatable/index';

type QColumnConfig = ColumnConfig<{query: Query; type: ?Type, focused: boolean}>;

function SeqHeaderCell(props) {
  const {column, onClick, style} = props;
  return (
    <DataTableHeaderCellRoot
      style={style}
      onClick={onClick}>
      <DataTableHeaderCellLabel title={column.field.label}>
        {column.field.label}
      </DataTableHeaderCellLabel>
      <DataTableHeaderCellMenu>
        {column.field.data.focused ? <IconCircle /> : <IconCircleO />}
      </DataTableHeaderCellMenu>
    </DataTableHeaderCellRoot>
  );
}

/**
 * Produce column config for a query.
 */
export function getColumnConfig(
  query: Query,
  focusedSeq: Array<string> = []
): QColumnConfig {
  return getColumnConfigImpl(query, focusedSeq, [], false);
}

function getColumnConfigImpl(query: Query, focusedSeq, path: Array<string>, suppressPath: boolean) {
  let stack: Array<QColumnConfig> = [];
  switch (query.name) {
    case 'pipeline':
      let pipeline = flattenPipeline(query).pipeline;
      let localPath = [];
      for (let i = 0; i < pipeline.length; i++) {
        if (pipeline[i].name === 'navigate' && !suppressPath) {
          localPath = pipeline[i].path;
        }
        let nav = getColumnConfigImpl(pipeline[i], focusedSeq, path.concat(localPath), false);
        stack = stack.concat(
          nav.type === 'stack'
            ? nav.stack
            : nav
        );
        if (!needDetailedColumn(nav, focusedSeq)) {
          break;
        }
      }
      break;
    case 'aggregate':
      stack.push({
        type: 'field',
        field: {
          cellRenderer,
          cellDataGetter,
          dataKey: ['0'],
          label: query.aggregate,
          data: {query, type: query.context.type, focused: false},
        },
        size: {width: 1, height: 1},
      });
      break;
    case 'navigate': {
      let type = query.context.type;
      let focused = path.join('.') === focusedSeq.join('.');
      stack.push({
        type: 'field',
        field: {
          cellRenderer,
          cellDataGetter,
          headerCellRenderer: type && type.name === 'seq' ? SeqHeaderCell : undefined,
          dataKey: path.length === 0 ? [query.path] : path,
          label: getColumnTitle(query),
          data: {query, type, focused},
        },
        size: {width: 1, height: 1},
      });
      break;
    }
    case 'select':
      let group = [];
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          group.push(getColumnConfigImpl(query.select[k], focusedSeq, path.concat(k), true));
        }
      }
      stack.push({
        type: 'group',
        group,
        size: {
          width: ArrayUtil.sum(group.map(c => c.size.width)),
          height: ArrayUtil.max(group.map(c => c.size.height)),
        },
      });
      break;
    default:
      break;
  }
  return stack.length === 1
    ? stack[0]
    : {
      type: 'stack',
      stack,
      size: {
        width: ArrayUtil.max(stack.map(c => c.size.width)),
        height: ArrayUtil.sum(stack.map(c => c.size.height)),
      }
    };
}

function getColumnTitle(query: NavigateQuery): string {
  if (query.context.domainEntityAttrtibute) {
    return query.context.domainEntityAttrtibute.title;
  } else if (query.context.domainEntity) {
    return query.context.domainEntity.title;
  } else {
    return query.path;
  }
}

function getData(data: Object, focusedSeq: Array<string>): Array<Object> {
  return ArrayUtil.transpose(data, focusedSeq);
}

type DataTableProps = {
  query: Query;
  data: Object;
  focusedSeq: Array<string>;
  onFocusedSeq: (focusedSeq: Array<string>) => *;
};

export class DataTable extends React.Component<*, DataTableProps, *> {

  columns: QColumnConfig;
  data: Array<Object>;

  static defaultProps = {
    focusedSeq: [],
  };

  constructor(props: DataTableProps) {
    super(props);
    this.columns = getColumnConfig(props.query, props.focusedSeq);
    this.data = getData(props.data, props.focusedSeq);
  }

  render() {
    return (
      <AutoSizer>
        {size => (
          <DataTableBase
            onColumnClick={this.onColumnClick}
            headerHeight={30}
            noRowsRenderer={this._noRowsRenderer}
            overscanRowCount={10}
            rowHeight={35}
            rowGetter={this._getRowData}
            rowCount={this.data.length}
            height={size.height}
            width={size.width}
            columns={this.columns}
            />
        )}
      </AutoSizer>
    )
  }

  onColumnClick = (column: ColumnField<{type: ?Type}>) => {
    if (column.field.data.type && column.field.data.type.name === 'seq') {
      this.props.onFocusedSeq(column.field.dataKey);
    }
  };

  componentWillReceiveProps(nextProps: DataTableProps) {
    if (
      nextProps.query !== this.props.query ||
      nextProps.focusedSeq !== this.props.focusedSeq
    ) {
      this.columns = getColumnConfig(nextProps.query, nextProps.focusedSeq);
    }
    if (
      nextProps.data !== this.props.data ||
      nextProps.query !== this.props.query ||
      nextProps.focusedSeq !== this.props.focusedSeq
    ) {
      this.data = getData(nextProps.data, nextProps.focusedSeq);
    }
  }

  _getRowData = ({index}: {index: number}) => {
    return this.data[index];
  };

  _noRowsRenderer = () => {
    return (
      <div>
        No data
      </div>
    )
  };

}

function cellDataGetter({rowData, dataKey, columnData: {type}}) {
  let cellData = rowData != null && typeof rowData === 'object'
    ? getByKey(rowData, dataKey)
    : rowData;
  return cellData;
}

function cellRenderer({
  columnData: {query},
  cellData,
  dataKey,
}): ?string | React.Element<*> {
  if (cellData === null) {
    return nullCell;
  } else if (cellData === undefined) {
    return null;
  } else if (query.context.type) {
    const type = query.context.type;
    const baseType = t.atom(type);
    if (baseType.name === 'entity' && typeof cellData === 'object' && cellData != null) {
      if (type.name === 'seq') {
        if (Array.isArray(cellData)) {
          cellData = cellData.map(entity =>
            formatEntity(baseType.entity, entity)).join(', ');
        }
      } else {
        if ('code' in cellData) {
          cellData = cellData.code;
        } else if ('name' in cellData) {
          cellData = cellData.name;
        } else if ('title' in cellData) {
          cellData = cellData.title;
        }
      }
    }
    if (type.name === 'boolean') {
      if (cellData === true) {
        return <BooleanTrueCell>✓</BooleanTrueCell>;
      } else if (cellData === false) {
        return <BooleanFalseCell>✗</BooleanFalseCell>;
      } else {
        return null;
      }
    } else if (type.name === 'number') {
      return String(cellData)
    } else {
      return String(cellData)
    }
  } else {
    return String(cellData)
  }
}

function formatEntity(entityName, entity) {
  if ('title' in entity) {
    return entity.title;
  } else if ('name' in entity) {
    return entity.name;
  } else if ('code' in entity) {
    return entity.code;
  } else {
    return entityName;
  }
}

let NullCell = style('div', {
  base: {
    color: '#bbb',
    textAlign: 'center',
  }
});

let nullCell = <NullCell>—</NullCell>;

let BooleanTrueCell = style('div', {
  displayName: 'BooleanTrueCell',
  base: {
    textAlign: 'right',
    color: 'green',
    paddingRight: 5,
    paddingLeft: 5,
  }
});

let BooleanFalseCell = style('div', {
  displayName: 'BooleanFalseCell',
  base: {
    textAlign: 'right',
    color: '#a90000',
    paddingRight: 5,
    paddingLeft: 5,
  }
});

function needDetailedColumn(column: ColumnConfig<*>, focusedSeq: Array<string>) {
  if (
    column.type === 'field' &&
    column.field.data.type &&
    column.field.data.type.name === 'seq'
  ) {
    let focusedSeqPrefix = focusedSeq.slice(0, column.field.dataKey.length);
    return focusedSeqPrefix.join('.') === column.field.dataKey.join('.');
  } else {
    return true;
  }
}
