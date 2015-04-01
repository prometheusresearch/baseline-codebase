/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
window.React                = React;
var {Column, Table}         = require('../vendor/fixed-data-table');
var {Box, LayoutAwareMixin} = require('./layout');
var Icon                    = require('./Icon');
var emptyFunction           = require('./emptyFunction');
var {Ref}                   = require('./Storage');
var PersistentStateMixin    = require('./PersistentStateMixin');

var DataTableStyle = {
  sortIcon: {
    color: '#AAA',
    fontSize: 10
  },
  sortIconActive: {
    color: '#000',
    fontSize: 10
  }
};

var DataTable = React.createClass({
  mixins: [LayoutAwareMixin, PersistentStateMixin],

  persistentStateKeys: {
    columnsWidths: null
  },

  render() {
    var {data, columns, selectable, resizableColumns, className, style, ...props} = this.props;
    var {width, height} = this.state;
    columns = columns.map(column => {
      var computedWidth = this.state.columnsWidths[column.key.join('.')];
      var width = computedWidth !== undefined ? computedWidth : column.width;
      var flexGrow = width !== undefined ? 0 : 1;
      var isResizable = column.resizable !== undefined ?
        column.resizable :
        resizableColumns;
      return (
        <Column
          headerRenderer={this._headerRenderer}
          cellDataGetter={this._cellDataGetter}
          cellRenderer={this._cellRenderer}
          key={column.key}
          fixed={column.fixed}
          dataKey={column.key}
          label={column.name}
          width={width || 0}
          flexGrow={flexGrow}
          isResizable={isResizable}
          columnData={column}
          />
      );
    });
    if (width === null || height === null) {
      return <Box size={1} className={className} style={style} />;
    } else {
      return (
        <Box size={1} className={className} style={style}>
          <Table
            {...props}
            ref="table"
            onRowClick={selectable && this._onRowClick}
            height={height}
            width={width}
            rowGetter={this._rowGetter}
            rowClassNameGetter={this._rowClassNameGetter}
            headerDataGetter={this._headerDataGetter}
            onScrollEnd={this._checkNeedPagination}
            onColumnResizeEndCallback={this._onColumnResizeEndCallback}
            isColumnResizing={false}
            rowsCount={data.data.length}>
            {columns}
          </Table>
        </Box>
      );
    }
  },

  getDefaultProps() {
    return {
      rowHeight: 35,
      headerHeight: 35,
      onDataSort: emptyFunction,
      onSelect: emptyFunction,
      onDeselect: emptyFunction
    };
  },

  getInitialState() {
    return {
      width: null,
      height: null
    };
  },

  getInitialPersistentState() {
    return {columnsWidths: {}};
  },

  componentDidUpdate(prevProps) {
    setTimeout(() => this._checkNeedPagination(), 0);
    if (prevProps.selected != null && this.props.selected == null) {
      setTimeout(() => {
        this.props.onDeselect();
      }, 0);
    }
  },

  componentDidMount() {
    this._recomputeGeometry();
    setTimeout(() => this._checkNeedPagination(), 0);
  },

  onLayoutChange() {
    this._recomputeGeometry();
  },

  _onColumnResizeEndCallback(newWidth, dataKey) {
    dataKey = dataKey.join('.');
    var columnsWidths = {...this.state.columnsWidths};
    columnsWidths[dataKey] = newWidth;
    this.setPersistentState({columnsWidths});
  },

  _headerDataGetter(cellDataKey) {
    return {sort: this.props.dataSort};
  },

  _headerRenderer(cellData, cellDataKey, rowData, columnData) {
    var sortable = rowData.sortable;
    if (sortable === undefined) {
      sortable = this.props.sortable;
    }
    var {dataSort} = this.props;
    if (!sortable) {
      return (
        <div>
          {String(cellData)}
        </div>
      );
    } else {
      cellDataKey = cellDataKey.join('.');
      var icon = <Icon name="sort" style={DataTableStyle.sortIcon} />;
      var isDesc = true;
      if (dataSort && (cellDataKey === dataSort || cellDataKey === dataSort.slice(1))) {
        if (dataSort[0] === '-') {
          isDesc = true;
          icon = <Icon name="sort-by-attributes-alt" style={DataTableStyle.sortIconActive} />;
        } else {
          isDesc = false;
          icon = <Icon name="sort-by-attributes" style={DataTableStyle.sortIconActive} />;
        }
      }
      return (
        <div onClick={this.props.onDataSort.bind(null, (isDesc ? '+' : '-') + cellDataKey)}>
          {cellData} {icon}
        </div>
      );
    }
  },

  _checkNeedPagination() {
    var {updating, loading, hasMore, data} = this.props.data;
    if (
      Array.isArray(data)
      && data.length - this._lastRowIndex < 10
      && !(updating || loading)
      && (hasMore || this.props.hasMore)
    ) {
      var {top, skip} = this.props.dataPagination;
      this.props.onDataPagination({top, skip: skip + top});
    }
  },

  _recomputeGeometry() {
    var {height, width} = this.getDOMNode().getBoundingClientRect();
    this.setState({height, width});
  },

  _cellRenderer(cellData, cellDataKey, rowData, rowIndex, columnData, width) {
    return <span title={cellData}>{renderToString(cellData)}</span>;
  },

  _cellDataGetter(key, row) {
    return getByKeyPath(row, key);
  },

  _rowGetter(rowIndex) {
    if (this._lastRowIndex === undefined || rowIndex > this._lastRowIndex) {
      this._lastRowIndex = rowIndex;
    }
    return this.props.data.data[rowIndex];
  },

  _rowClassNameGetter(rowIndex) {
    var {selectable, selected} = this.props;
    var row = this._rowGetter(rowIndex);
    if (selectable && row && row.id == selected) {
      return 'DataTable__row--selected';
    }
  },

  _onRowClick(e, rowIndex, row) {
    var {selectable, selected, onSelected, onSelect} = this.props;
    if (selectable && row.id != selected) {
      onSelected(row.id);
    }
    if (onSelect) {
      onSelect();
    }
  }
});

function getByKeyPath(row, keyPath) {
  if (!Array.isArray(keyPath)) {
    keyPath = [keyPath];
  }
  for (var i = 0, len = keyPath.length; i < len; i++) {
    if (row == null) {
      return row;
    }
    row = row[keyPath[i]];
    if (row instanceof Ref) {
      row = row.resolve();
    }
  }
  return row;
}

function renderToString(value) {
  return value === null || value === undefined ?  '' : String(value);
}

module.exports = DataTable;
