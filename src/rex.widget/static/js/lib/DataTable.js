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
  mixins: [LayoutAwareMixin],

  render() {
    var {data, columns, selectable, ...props} = this.props;
    var {width, height} = this.state;
    columns = columns.map(column =>
      <Column
        headerRenderer={this._headerRenderer}
        cellDataGetter={this._cellDataGetter}
        key={column.key}
        fixed={column.fixed}
        dataKey={column.key}
        label={column.name}
        width={column.width}
        flexGrow={column.width ? undefined : 1}
        />
    );
    if (width === null || height === null) {
      return <Box size={1} />;
    } else {
      return (
        <Box size={1}>
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
      onDataSort: emptyFunction
    };
  },

  getInitialState() {
    return {
      width: null,
      height: null
    };
  },

  componentDidMount() {
    this._recomputeGeometry();
    this._checkNeedPagination();
  },

  onLayoutChange() {
    this._recomputeGeometry();
  },

  _headerDataGetter() {
    return {sort: this.props.dataSort};
  },

  _headerRenderer(cellData, cellDataKey, rowData, columnData) {
    var {dataSort, sortable} = this.props;
    if (!sortable) {
      return (
        <div>
          {cellData}
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
    var {updating, hasMore, data} = this.props.data;
    if (
      Array.isArray(data)
      && data.length - this._lastRowIndex < 10
      && !updating
      && hasMore
    ) {
      var {top, skip} = this.props.dataPagination;
      this.props.onDataPagination({top, skip: skip + top});
    }
  },

  _recomputeGeometry() {
    var {height, width} = this.getDOMNode().getBoundingClientRect();
    this.setState({height, width});
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
    if (selectable && this._rowGetter(rowIndex).id == selected) {
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

module.exports = DataTable;
