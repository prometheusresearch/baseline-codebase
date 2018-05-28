/**
 * @flow
 */

import type {Type, QueryPipeline} from './model/types';
import type {ColumnConfig, ColumnField} from './ui/datatable/DataTable';
import type {Actions} from './state';

import * as React from 'react';
import {style, css, VBox} from 'react-stylesheet';
import {AutoSizer} from 'react-virtualized';

import * as ArrayUtil from './ArrayUtil';
import {LoadingIndicator} from './ui';
import {DataTable as DataTableBase, DataTableColumnMenuItem} from './ui/datatable';
import * as DataTableColumnConfig from './DataTableColumnConfig';

type DataTableProps = {
  query: QueryPipeline,
  loading?: boolean,
  data: Object,
  focusedSeq: Array<string>,
  onFocusedSeq: (focusedSeq: Array<string>) => *,
};

export default class DataTable extends React.Component<DataTableProps> {
  columns: ColumnConfig<DataTableColumnConfig.ColumnSpecData>;
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
    this.columns = DataTableColumnConfig.fromQuery(props.query, props.focusedSeq);
    this.data = getData(props.data, props.focusedSeq);
  }

  render() {
    const {loading} = this.props;
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
        <LoadingShim variant={{visible: loading}} />
        <LoadingPane variant={{visible: loading}}>
          <LoadingIndicator />
        </LoadingPane>
      </VBox>
    );
  }

  renderColumnMenu = (column: ColumnField<*>) => {
    return [
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
      <DataTableColumnMenuItem key="hide" value="hide">
        Remove column
      </DataTableColumnMenuItem>,
    ];
  };

  onColumnMenuSelect = (
    column: ColumnField<DataTableColumnConfig.ColumnSpecData>,
    value: string,
  ) => {
    const {navigateFromPipeline, navigatePath, navigate, pipeline} = column.field.data;
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
        if (pipeline.context.type.name === 'record') {
          this.context.actions.appendNavigate({
            at: pipeline,
            path: [navigate.path],
          });
        } else {
          this.context.actions.appendNavigate({
            at: navigateFromPipeline,
            path: navigatePath,
          });
        }
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

  onColumnSort = (column: ColumnField<DataTableColumnConfig.ColumnSpecData>) => {
    const {select} = column.field.data;
    if (select != null) {
      const dir = select.sort && select.sort.dir === 'asc' ? 'desc' : 'asc';
      const {navigatePath} = column.field.data;
      this.context.actions.sortBy({at: select, sort: {navigatePath, dir}});
    }
  };

  componentWillReceiveProps(nextProps: DataTableProps) {
    if (
      nextProps.query !== this.props.query ||
      nextProps.focusedSeq !== this.props.focusedSeq
    ) {
      this.columns = DataTableColumnConfig.fromQuery(
        nextProps.query,
        nextProps.focusedSeq,
      );
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
    return <div>No data</div>;
  };
}

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

let LoadingShim = style(VBox, {
  base: {
    background: css.rgba(255, 0.5),
    position: 'absolute',
    zIndex: 900,
    height: '100%',
    width: '100%',
    left: 0,
    bottom: 0,
    top: 0,
    right: 0,
    opacity: 0,
    transition: 'opacity 0.3s',
    display: 'none',
  },
  visible: {
    opacity: 100,
    display: 'block',
  },
});

function getData(data: Object, focusedSeq: Array<string>): Array<Object> {
  return ArrayUtil.transpose(data, focusedSeq);
}
