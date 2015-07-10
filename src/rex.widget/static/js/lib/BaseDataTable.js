/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
var {Column, Table}         = require('fixed-data-table');
var ZyngaScroller           = require('./Scroller');
var {Box, LayoutAwareMixin} = require('./Layout');
var Icon                    = require('./Icon');
var emptyFunction           = require('./emptyFunction');
var PersistentStateMixin    = require('./PersistentStateMixin');
var TouchableArea           = require('./TouchableArea');
var isTouchDevice           = require('./Environment').isTouchDevice;
var getByKeyPath            = require('./getByKeyPath');
var SingleTimeoutMixin      = require('./SingleTimeoutMixin');
var isReactElement          = require('./isReactElement');

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
  mixins: [SingleTimeoutMixin, LayoutAwareMixin, PersistentStateMixin],

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
    var {width, height} = this.state;
    var {style, className, ...props} = this.props;
    if (width === null || height === null) {
      return <Box size={1} className={className} style={style} />;
    } else {
      var {data, columns: columnsSpec, resizableColumns, ...props} = props;
      var columns = columnsSpec.map(this.renderColumn);
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
            height={height}
            width={width}
            rowGetter={this._rowGetter}
            rowClassNameGetter={this._rowClassNameGetter}
            isColumnResizing={false}
            onRowClick={this._onRowClick}
            onScrollEnd={this._checkNeedPagination}
            onColumnResizeEndCallback={this._onColumnResizeEndCallback}
            rowsCount={data.data.length}>
            {columns}
          </Table>
        </TouchableArea>
      );
    }
  },

  renderColumn(column) {
    var computedWidth = this.state.columnsWidths[column.valueKey.join('.')];
    var width = computedWidth !== undefined ? computedWidth : column.width;
    var flexGrow = width !== undefined ? 0 : 1;
    var isResizable = column.resizable !== undefined ?
      column.resizable :
      this.props.resizableColumns;
    return (
      <Column
        headerRenderer={this.renderHeader}
        cellRenderer={this.renderCell}
        cellDataGetter={this._cellDataGetter}
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
  },

  renderCell(cellData, cellDataKey, rowData, rowIndex, columnData, width) {
    var onCellClick = this.props.onCellClick && this.props.onCellClick.bind(null, cellDataKey, cellData, rowData);
    if (columnData.widget) {
      if (isReactElement(columnData.widget)) {
        return React.cloneElement(columnData.widget, {cellData, onCellClick});
      } else {
        return React.cloneElement(columnData.widget.column, {cellData, onCellClick});
      }
    } else {
      return (
        <span title={cellData} onClick={onCellClick}>
          {renderToString(cellData)}
        </span>
      );
    }
  },

  renderHeader(label, cellDataKey, columnData, rowData, width) {
    var sortable = columnData.sortable;
    if (sortable === undefined) {
      sortable = this.props.sortable;
    }
    var {dataSort} = this.props;
    if (!sortable) {
      return (
        <div>
          {label}
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
          {label} {icon}
        </div>
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
      onSelected: emptyFunction
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
    this.setTimeout(() => this._checkNeedPagination(), 0);
  },

  componentDidMount() {
    this._recomputeGeometry();
    this.setTimeout(() => this._checkNeedPagination(), 0);
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
    var {selected} = this.props;
    var row = this._rowGetter(rowIndex);
    if (row && row.id == selected) {
      return 'DataTable__row--selected';
    }
  },

  _onRowClick(e, rowIndex, row) {
    var {selected, onSelected} = this.props;
    if (row.id != selected) {
      onSelected(row.id, row);
    }
  }
});

/**
 * Render null and undefined as empty string but get toString from any other
 * object.
 */
function renderToString(value) {
  return value == null ?  '' : String(value);
}

module.exports = DataTable;
