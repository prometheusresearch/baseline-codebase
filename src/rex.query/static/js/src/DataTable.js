/**
 * @flow
 */

import type {Type, Query, SelectQuery, QueryPipeline, NavigateQuery} from './model/types';
import type {ColumnConfig, ColumnField} from './ui/datatable/DataTable';
import type {Actions} from './state';

import * as React from 'react';
import {style, css, VBox} from 'react-stylesheet';
import {AutoSizer} from 'react-virtualized';

import * as ArrayUtil from './ArrayUtil';
import {LoadingIndicator} from './ui';
import {
  DataTable as DataTableBase,
  DataTableColumnMenuItem,
  getByKey,
} from './ui/datatable';

/**
 * Data associated with column.
 */
export type ColumnSpecData = {
  query: Query,
  pipeline: QueryPipeline,
  select: ?SelectQuery,
  navigate: ?NavigateQuery,
  type: Type,
  focusedSeq: Array<string>,
  focused: boolean,
};

/**
 * Info needed during query traverse.
 */
type QueryTraverseContext = {
  focusedSeq: Array<string>,
  path: Array<string>,
  queryPipeline: QueryPipeline,
  selectQuery: ?SelectQuery,
  bindingName: ?string,
  suppressPath: boolean,
  currentStack?: Array<ColumnConfig<ColumnSpecData>>,
};

/**
 * Produce column config for a query.
 */
export function getColumnConfig(
  query: QueryPipeline,
  focusedSeq: Array<string> = [],
): ColumnConfig<ColumnSpecData> {
  const ctx: QueryTraverseContext = {
    queryPipeline: query,
    selectQuery: null,
    path: [],
    focusedSeq,
    bindingName: null,
    suppressPath: false,
    currentStack: undefined,
  };
  return getColumnConfigImpl(query, ctx);
}

function getColumnConfigImpl(query: Query, ctx: QueryTraverseContext) {
  let stack: Array<ColumnConfig<ColumnSpecData>> = [];
  switch (query.name) {
    case 'pipeline': {
      let bindingName = ctx.bindingName;
      let pipeline = query.pipeline;
      let localPath = [];
      let skipAllowed = false;
      for (let i = 0; i < pipeline.length; i++) {
        if (pipeline[i].name === 'navigate' && !ctx.suppressPath) {
          localPath = pipeline[i].path;
        }
        let nav = getColumnConfigImpl(pipeline[i], {
          ...ctx,
          bindingName,
          path: ctx.path.concat(localPath),
          suppressPath: false,
          currentStack: stack,
        });
        bindingName = null;
        if (nav.type !== 'field' && skipAllowed) {
          break;
        }
        stack = stack.concat(nav.type === 'stack' ? nav.columnList : nav);
        skipAllowed = !needDetailedColumn(nav, ctx.focusedSeq);
      }
      break;
    }
    case 'aggregate': {
      const prev = ctx.currentStack != null ? ctx.currentStack.pop() : null;
      let dataKey = prev && prev.type === 'field' ? prev.field.dataKey : ['0'];
      let label = prev && prev.type === 'field' && prev.field.label
        ? query.aggregate === 'count' ? '# ' + prev.field.label : prev.field.label
        : query.aggregate;
      const sort = ctx.selectQuery != null &&
        ctx.selectQuery.sort != null &&
        ctx.selectQuery.sort.name === dataKey[dataKey.length - 1]
        ? ctx.selectQuery.sort.dir
        : null;
      stack.push({
        type: 'field',
        id: 'field:' + ctx.path.join('__'),
        field: {
          cellRenderer,
          cellDataGetter,
          dataKey,
          label,
          sort,
          data: {
            query,
            pipeline: ctx.queryPipeline,
            select: ctx.selectQuery,
            navigate: prev != null && prev.type === 'field'
              ? prev.field.data.navigate
              : null,
            type: query.context.type,
            focusedSeq: ctx.focusedSeq,
            focused: false,
          },
        },
        size: {width: 1, height: 1},
      });
      break;
    }
    case 'navigate': {
      if (query.path in query.context.prev.scope) {
        let binding = query.context.prev.scope[query.path];
        return getColumnConfigImpl(binding.query, {
          ...ctx,
          queryPipeline: binding.query,
          bindingName: binding.query.context.title || binding.name,
          suppressPath: true,
          currentStack: undefined,
        });
      }
      let type = query.context.type;
      let focused =
        ctx.path.join('.') === ctx.focusedSeq.join('.') && type.card === 'seq';
      const dataKey = ctx.path.length === 0 ? [query.path] : ctx.path;
      let sort = false;
      if (type.name !== 'record') {
        sort = ctx.selectQuery != null &&
          ctx.selectQuery.sort != null &&
          ctx.selectQuery.sort.name === dataKey[dataKey.length - 1]
          ? ctx.selectQuery.sort.dir
          : null;
      }
      stack.push({
        type: 'field',
        id: 'field:' + (ctx.path.length === 0 ? [query.path] : ctx.path).join('__'),
        field: {
          cellRenderer,
          cellDataGetter,
          dataKey,
          label: query.context.title || query.path,
          sort,
          data: {
            query,
            pipeline: ctx.queryPipeline,
            select: ctx.selectQuery,
            navigate: query,
            type,
            focusedSeq: ctx.focusedSeq,
            focused,
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
            getColumnConfigImpl(query.select[k], {
              ...ctx,
              selectQuery: query,
              path: ctx.path.concat(k),
              bindingName: null,
              suppressPath: true,
              currentStack: undefined,
            }),
          );
        }
      }
      stack.push({
        type: 'group',
        id: 'group:' + ctx.path.join('__'),
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
        id: 'stack:' + ctx.path.join('__'),
        columnList: stack,
        size: {
          width: ArrayUtil.max(stack.map(c => c.size.width)),
          height: ArrayUtil.sum(stack.map(c => c.size.height)),
        },
      };
}

function getData(data: Object, focusedSeq: Array<string>): Array<Object> {
  return ArrayUtil.transpose(data, focusedSeq);
}

type DataTableProps = {
  query: QueryPipeline,
  loading?: boolean,
  data: Object,
  focusedSeq: Array<string>,
  onFocusedSeq: (focusedSeq: Array<string>) => *,
};

export default class DataTable extends React.Component<*, DataTableProps, *> {
  columns: ColumnConfig<ColumnSpecData>;
  data: Array<Object>;
  context: {
    actions: Actions,
  };

  static defaultProps = {
    focusedSeq: [],
  };

  static contextTypes = {actions: React.PropTypes.object};

  constructor(props: DataTableProps) {
    super(props);
    this.columns = getColumnConfig(props.query, props.focusedSeq);
    this.data = getData(props.data, props.focusedSeq);
  }

  render() {
    return (
      <VBox flexGrow={1}>
        <AutoSizer>
          {size =>
            <DataTableBase
              onColumnClick={this.onColumnClick}
              onColumnSort={this.onColumnSort}
              headerHeight={30}
              noRowsRenderer={this._noRowsRenderer}
              overscanRowCount={10}
              rowHeight={35}
              rowGetter={this._getRowData}
              rowCount={this.data.length}
              width={size.width}
              height={size.height}
              columns={this.columns}
              onColumnMenuSelect={this.onColumnMenuSelect}
              renderColumnMenu={this.renderColumnMenu}
            />}
        </AutoSizer>
        <LoadingPane variant={{visible: this.props.loading}}>
          <LoadingIndicator />
        </LoadingPane>
      </VBox>
    );
  }

  renderColumnMenu = (column: ColumnField<*>) => {
    return [
      <DataTableColumnMenuItem key="hide" value="hide">
        Remove column
      </DataTableColumnMenuItem>,
      <DataTableColumnMenuItem key="goto" value="goto">
        Follow column
      </DataTableColumnMenuItem>,
      <DataTableColumnMenuItem key="link" value="link">
        Link as a query
      </DataTableColumnMenuItem>,
      column.field.sort !== false &&
        <DataTableColumnMenuItem key="sort" value="sort">
          {column.field.sort === 'asc' ? 'Sort desceding' : 'Sort asceding'}
        </DataTableColumnMenuItem>,
    ];
  };

  onColumnMenuSelect = (column: ColumnField<ColumnSpecData>, value: string) => {
    const {pipeline, navigate} = column.field.data;
    if (navigate == null) {
      return;
    }
    switch (value) {
      case 'hide': {
        this.context.actions.cut({at: navigate});
        break;
      }
      case 'link': {
        this.context.actions.appendDefine({
          at: pipeline,
          path: [navigate.path],
        });
        break;
      }
      case 'sort': {
        this.onColumnSort(column);
        break;
      }
      case 'goto': {
        this.context.actions.appendNavigate({
          at: pipeline,
          path: [navigate.path],
        });
        break;
      }
      default:
        break;
    }
  };

  onColumnClick = (column: ColumnField<{type: Type}>) => {
    if (column.field.data.type.card === 'seq') {
      this.props.onFocusedSeq(column.field.dataKey);
    }
  };

  onColumnSort = (column: ColumnField<ColumnSpecData>) => {
    const {select} = column.field.data;
    if (select != null) {
      const dir = select.sort && select.sort.dir === 'asc' ? 'desc' : 'asc';
      const name = column.field.dataKey[column.field.dataKey.length - 1];
      this.context.actions.sortBy({at: select, sort: {name, dir}});
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
    );
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
    if (type.name === 'record' && typeof cellData === 'object' && cellData != null) {
      if (type.card === 'seq') {
        if (Array.isArray(cellData)) {
          return cellData.map(entity => formatEntity(type.entity, entity)).join(', ');
        } else {
          return String(cellData);
        }
      } else {
        return formatEntity(type.entity, cellData);
      }
    } else if (type.name === 'boolean') {
      if (cellData === true) {
        return <BooleanTrueCell>✓</BooleanTrueCell>;
      } else if (cellData === false) {
        return <BooleanFalseCell>✗</BooleanFalseCell>;
      } else {
        return null;
      }
    } else if (type.name === 'number') {
      return <NumberCell>{String(cellData)}</NumberCell>;
    } else if (type.name === 'date') {
      return String(cellData);
    } else if (type.name === 'time') {
      return String(cellData);
    } else if (type.name === 'datetime') {
      return String(cellData);
    } else if (type.name === 'json') {
      return formatJSON(cellData);
    } else {
      return String(cellData);
    }
  } else {
    return String(cellData);
  }
}

function formatJSON(data) {
  // TODO: click to show data in a modal?
  return <JSONCell>— JSON data —</JSONCell>;
}

function formatEntity(entityName, entity): ?string | React.Element<*> {
  if (typeof entity === 'string') {
    return entity;
  } else if (typeof entity === 'boolean') {
    return entity;
  } else if (typeof entity === 'number') {
    return entity;
  } else if (entity == null) {
    return entity;
  } else if ('title' in entity) {
    return (entity.title: any);
  } else if ('name' in entity) {
    return (entity.name: any);
  } else if ('code' in entity) {
    return (entity.code: any);
  } else if ('id' in entity) {
    return (entity.id: any);
  } else {
    return <JSONCell>{'{'}Record: {entityName}{'}'}</JSONCell>;
  }
}

let NullCell = style('div', {
  base: {
    color: '#bbb',
    textAlign: 'center',
  },
});

let nullCell = <NullCell>—</NullCell>;

let NumberCell = style('div', {
  displayName: 'NumberCell',
  base: {
    textAlign: 'right',
    paddingRight: 5,
    paddingLeft: 5,
  },
});

let BooleanTrueCell = style('div', {
  displayName: 'BooleanTrueCell',
  base: {
    textAlign: 'right',
    color: 'green',
    paddingRight: 5,
    paddingLeft: 5,
  },
});

let BooleanFalseCell = style('div', {
  displayName: 'BooleanFalseCell',
  base: {
    textAlign: 'right',
    color: '#a90000',
    paddingRight: 5,
    paddingLeft: 5,
  },
});

let JSONCell = style('div', {
  displayName: 'JSONCell',
  base: {
    color: '#888',
    fontFamily: 'Menlo, monospace',
    fontSize: '7pt',
  },
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
