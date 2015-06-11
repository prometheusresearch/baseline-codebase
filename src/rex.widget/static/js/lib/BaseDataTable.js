/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
window.React                = React;
var {Column, Table}         = require('../vendor/fixed-data-table');
var ZyngaScroller           = require('./Scroller');
var {Box, LayoutAwareMixin} = require('./Layout');
var Icon                    = require('./Icon');
var emptyFunction           = require('./emptyFunction');
var PersistentStateMixin    = require('./PersistentStateMixin');
var TouchableArea           = require('./TouchableArea');
var isTouchDevice           = require('./Environment').isTouchDevice;

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

/**
 * DataTable component.
 */
var DataTable = React.createClass({
  mixins: [LayoutAwareMixin, PersistentStateMixin],

  propTypes: {

    /**
     * An array of column specifications.
     *
     * Each column has a form of::
     *
     *   {
     *     valueKey: <column key>,
     *     label: <column name>,
     *     width: <column width>,
     *     sortable: <if column should be made sortable>,
     *     resizable: <if column should be made resizable>
     *   }
     *
     */
    columns: React.PropTypes.array.isRequired,

    /**
     * DataSet object (RexWidget.DataSet) used to render DataTable.
     */
    data: React.PropTypes.object.isRequired,

    /**
     * If DataTable should allow selecting its rows.
     */
    selectable: React.PropTypes.bool,

    /**
     * Callback which is executed when selected row changes, it is provided with
     * row id and row itself as its arguments.
     */
    onSelected: React.PropTypes.func,

    /**
     * Currently selected row id.
     */
    selected: React.PropTypes.string
  },

  persistentStateKeys: {
    columnsWidths: null
  },

  render() {
    var {data, columns, selectable, resizableColumns, className, style, ...props} = this.props;
    var {width, height} = this.state;
    columns = columns.map(column => {
      var computedWidth = this.state.columnsWidths[column.valueKey.join('.')];
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
          key={column.valueKey}
          fixed={column.fixed}
          dataKey={column.valueKey}
          label={column.label}
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
        <TouchableArea scroller={isTouchDevice ? this.scroller : undefined}
          element={Box}
          size={1}
          className={className}
          style={{...style, cursor: 'pointer'}}>
          <Table
            {...props}
            onContentHeightChange={isTouchDevice ? this._onContentDimensionsChange : undefined}
            scrollTop={isTouchDevice ? this.state.top : undefined}
            scrollLeft={isTouchDevice ? this.state.left: undefined}
            overflowX={isTouchDevice ? 'hidden' : 'auto'}
            overflowY={isTouchDevice ? 'hidden' : 'auto'}
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
        </TouchableArea>
      );
    }
  },

  getDefaultProps() {
    return {
      rowHeight: 35,
      headerHeight: 35,
      resizableColumns: true,
      sortable: true,
      onDataSort: emptyFunction,
      onSelect: emptyFunction,
      onDeselect: emptyFunction
    };
  },

  getInitialState() {
    return {
      width: null,
      height: null,
      left: 0,
      top: 0
    };
  },

  getInitialPersistentState() {
    return {columnsWidths: {}};
  },

  componentWillMount() {
    if (isTouchDevice) {
      this.scroller = new ZyngaScroller(this._handleScroll);
    }
  },

  _handleScroll(left, top) {
    if (isTouchDevice) {
      this.setState({left, top});
    }
  },

  _onContentDimensionsChange(contentHeight, contentWidth) {
    if (isTouchDevice) {
      this.scroller.setDimensions(
        this.state.width,
        this.state.height,
        contentWidth,
        contentHeight
      );
    }
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
    var onCellClick = this.props.onCellClick && this.props.onCellClick.bind(null, cellDataKey, cellData, rowData);
    return <span title={cellData} onClick={onCellClick}>{renderToString(cellData)}</span>;
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
      onSelected(row.id, row);
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
  }
  return row;
}

function renderToString(value) {
  return value === null || value === undefined ?  '' : String(value);
}

module.exports = DataTable;
