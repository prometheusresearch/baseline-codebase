/**
 * @flow
 */

import type {Query, NavigateQuery} from '../model/Query';
import type {Type} from '../model/Type';
import type {ColumnConfig, ColumnField} from './datatable/DataTable';

import React from 'react';
import {style, css, VBox} from 'react-stylesheet';
import {AutoSizer} from 'react-virtualized';

import {LoadingIndicator} from '../ui';
import * as q from '../model/Query';
import * as ArrayUtil from '../ArrayUtil';
import {
  DataTable as DataTableBase,
  getByKey
} from './datatable/index';

type QColumnConfig = ColumnConfig<{
  query: Query;
  type: Type;
  focusedSeq: Array<string>;
  focused: boolean;
}>;

/**
 * Produce column config for a query.
 */
export function getColumnConfig(
  query: Query,
  focusedSeq: Array<string> = []
): QColumnConfig {
  return getColumnConfigImpl(query, focusedSeq, [], null, false);
}

function getColumnConfigImpl(
  query: Query,
  focusedSeq,
  path: Array<string>,
  bindingName: ?string,
  suppressPath: boolean,
  currentStack?: Array<QColumnConfig>,
) {
  let stack: Array<QColumnConfig> = [];
  switch (query.name) {
    case 'pipeline':
      let pipeline = query.pipeline;
      let localPath = [];
      let skipAllowed = false;
      for (let i = 0; i < pipeline.length; i++) {
        if (pipeline[i].name === 'navigate' && !suppressPath) {
          localPath = pipeline[i].path;
        }
        let nav = getColumnConfigImpl(
          pipeline[i],
          focusedSeq,
          path.concat(localPath),
          bindingName,
          false,
          stack,
        );
        bindingName = null;
        if (nav.type !== 'field' && skipAllowed) {
          break;
        }
        stack = stack.concat(
          nav.type === 'stack'
            ? nav.columnList
            : nav
        );
        skipAllowed = !needDetailedColumn(nav, focusedSeq);
      }
      break;
    case 'aggregate': {
      let prev = currentStack != null
        ? currentStack.pop()
        : null;
      let dataKey = prev && prev.type === 'field'
        ? prev.field.dataKey
        : ['0'];
      let label = prev && prev.type === 'field' && prev.field.label
        ? prev.field.label
        : query.aggregate;
      stack.push({
        type: 'field',
        id: 'field:' + dataKey.join('__'),
        field: {
          cellRenderer,
          cellDataGetter,
          dataKey,
          label,
          data: {
            query,
            type: query.context.type,
            focusedSeq,
            focused: false
          },
        },
        size: {width: 1, height: 1},
      });
      break;
    }
    case 'navigate': {
      if (query.path in query.context.prev.scope) {
        let binding = query.context.prev.scope[query.path];
        return getColumnConfigImpl(
          binding.query,
          focusedSeq,
          path,
          q.genQueryName(binding.query) || binding.name,
          true
        );
      }
      let type = query.context.type;
      let focused = path.join('.') === focusedSeq.join('.') && type.card === 'seq';
      stack.push({
        type: 'field',
        id: 'field:' + (path.length === 0 ? [query.path] : path).join('__'),
        field: {
          cellRenderer,
          cellDataGetter,
          dataKey: path.length === 0 ? [query.path] : path,
          label: bindingName ? bindingName : getColumnTitle(query),
          data: {
            query,
            type,
            focusedSeq,
            focused
          },
        },
        size: {width: 1, height: 1},
      });
      break;
    }
    case 'select':
      let group = [];
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          group.push(
            getColumnConfigImpl(
              query.select[k],
              focusedSeq,
              path.concat(k),
              null,
              true
            )
          );
        }
      }
      stack.push({
        type: 'group',
        id: 'group:' + path.join('__'),
        columnList: group,
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
      id: 'stack:' + path.join('__'),
      columnList: stack,
      size: {
        width: ArrayUtil.max(stack.map(c => c.size.width)),
        height: ArrayUtil.sum(stack.map(c => c.size.height)),
      }
    };
}

function getColumnTitle(query: NavigateQuery): string {
  return query.path;
}

function getData(data: Object, focusedSeq: Array<string>): Array<Object> {
  return ArrayUtil.transpose(data, focusedSeq);
}

type DataTableProps = {
  query: Query;
  loading?: boolean;
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
      <VBox flexGrow={1}>
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
              width={size.width}
              height={size.height}
              columns={this.columns}
              />
          )}
        </AutoSizer>
        <LoadingPane variant={{visible: this.props.loading}}>
          <LoadingIndicator />
        </LoadingPane>
      </VBox>
    )
  }

  onColumnClick = (column: ColumnField<{type: Type}>) => {
    if (column.field.data.type.card === 'seq') {
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

function cellDataGetter({rowData, dataKey, columnData: {type, focusedSeq}}) {
  let cellData = rowData != null && typeof rowData === 'object'
    ? getByKey(rowData, dataKey, focusedSeq)
    : rowData;
  return cellData;
}

function cellRenderer({
  columnData: {query},
  cellData,
  dataKey,
}): ?string | React.Element<*> {
  if (cellData === null) {
    return nullCell; // eslint-disable-line no-use-before-define
  } else if (cellData === undefined) {
    return null;
  } else if (query.context.type) {
    const type = query.context.type;
    if (
      type.name === 'record' &&
      typeof cellData === 'object' &&
      cellData != null
    ) {
      if (type.card === 'seq') {
        if (Array.isArray(cellData)) {
          cellData = cellData.map(entity =>
            formatEntity(type.entity, entity)).join(', ');
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
    } else if (type.name === 'date') {
      return String(cellData)
    } else if (type.name === 'time') {
      return String(cellData)
    } else if (type.name === 'datetime') {
      return String(cellData)
    } else {
      return String(cellData)
    }
  } else {
    return String(cellData)
  }
}

function formatEntity(entityName, entity) {
  if (typeof entity === 'string') {
    return entity;
  } else if ('title' in entity) {
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

let LoadingPane = style(VBox, {
  base: {
    background: css.rgba(230, 0.9),
    position: 'absolute',
    zIndex: 1000,
    height: 30,
    width: 100,
    left: 'calc(50% - 50px)',
    justifyContent: 'center',
    bottom: 0,
    opacity: 0,
    transition: 'opacity 0.3s, bottom 0.3s',
    borderRadius: 13,
  },
  visible: {
    bottom: 10,
    opacity: 100,
  },
});

function needDetailedColumn(column: ColumnConfig<*>, focusedSeq: Array<string>) {
  if (
    column.type === 'field' &&
    column.field.data.type &&
    column.field.data.type.card === 'seq'
  ) {
    let focusedSeqPrefix = focusedSeq.slice(0, column.field.dataKey.length);
    return focusedSeqPrefix.join('.') === column.field.dataKey.join('.');
  } else {
    return true;
  }
}
