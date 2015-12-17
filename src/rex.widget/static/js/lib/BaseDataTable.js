/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import classNames from './datatable/DataTableBase.css';

import React                   from 'react';
import {Column, Table}         from 'fixed-data-table';
import Icon                    from './ui/Icon';
import ZyngaScroller           from './Scroller';
import {Box, LayoutAwareMixin} from './Layout';
import emptyFunction           from './emptyFunction';
import PersistentStateMixin    from './PersistentStateMixin';
import TouchableArea           from './TouchableArea';
import {isTouchDevice}         from './Environment';
import getByKeyPath            from './getByKeyPath';
import SingleTimeoutMixin      from './SingleTimeoutMixin';

let Style = {
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
let DataTable = React.createClass({
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
     * If table is sortable.
     */
    sortable: React.PropTypes.bool,

    /**
     * If columns should be made resizable.
     */
    resizableColumns: React.PropTypes.bool,

    /**
     * Currently selected row id.
     */
    selected: React.PropTypes.string,

    /**
     * Callback which is executed when selected row changes, it is provided with
     * row id and row itself as its arguments.
     */
    onSelected: React.PropTypes.func,

    /**
     * Callback which is called on click on table cell.
     */
    onCellClick: React.PropTypes.func,

    /**
     * If table can ask for more data.
     */
    hasMore: React.PropTypes.bool,

    /**
     * Data pagination parameters (top and skip as in Rex Port).
     */
    dataPagination: React.PropTypes.object,

    /**
     * Callback which is called when table needs more data.
     */
    onDataPagination: React.PropTypes.func,

    /**
     * Sort column and direction.
     */
    dataSort: React.PropTypes.string,

    /**
     * Callback which is called when table asks to change sort column and/or
     * direction.
     */
    onDataSort: React.PropTypes.func,

    /**
     * CSS class name to apply to DOM node.
     */
    className: React.PropTypes.string,

    /**
     * Style to apply to DOM node.
     */
    style: React.PropTypes.object,
  },

  persistentStateKeys: {
    columnsWidths: null
  },

  render() {
    let {width, height} = this.state;
    let {style, className} = this.props;
    if (width === null || height === null) {
      return <Box size={1} className={className} style={style} />;
    } else {
      let {data, columns: columnsSpec, resizableColumns, ...props} = this.props;
      let columns = columnsSpec.map(this.renderColumn);
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
            scrollLeft={isTouchDevice ? this.state.left : undefined}
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
    let computedWidth = this.state.columnsWidths[column.valueKey.join('.')];
    let width = computedWidth !== undefined ? computedWidth : column.width;
    let flexGrow = width !== undefined ? 0 : 1;
    let isResizable = column.resizable !== undefined ?
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

  renderCell(cellData, cellDataKey, rowData, rowIndex, columnData) {
    let onCellClick;
    if (this.props.onCellClick) {
      onCellClick = this.props.onCellClick.bind(null, cellDataKey, cellData, rowData);
    }
    if (columnData.widget && columnData.widget.column) {
      return React.cloneElement(columnData.widget.column, {cellData, onCellClick});
    } else {
      return (
        <span title={cellData} onClick={onCellClick}>
          {renderToString(cellData)}
        </span>
      );
    }
  },

  renderHeader(label, cellDataKey, columnData) {
    let sortable = columnData.sortable;
    if (sortable === undefined) {
      sortable = this.props.sortable;
    }
    let {dataSort} = this.props;
    if (!sortable) {
      return (
        <div>
          {label}
        </div>
      );
    } else {
      cellDataKey = cellDataKey.join('.');
      let icon = <Icon name="sort" style={Style.sortIcon} />;
      let isDesc = true;
      if (dataSort && (cellDataKey === dataSort || cellDataKey === dataSort.slice(1))) {
        if (dataSort[0] === '-') {
          isDesc = true;
          icon = <Icon name="sort-by-attributes-alt" style={Style.sortIconActive} />;
        } else {
          isDesc = false;
          icon = <Icon name="sort-by-attributes" style={Style.sortIconActive} />;
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

  componentDidUpdate() {
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
    let columnsWidths = {...this.state.columnsWidths};
    columnsWidths[dataKey] = newWidth;
    this.setPersistentState({columnsWidths});
  },

  _checkNeedPagination() {
    let {updating, loading, hasMore, data} = this.props.data;
    if (
      Array.isArray(data)
      && data.length - this._lastRowIndex < 10
      && !(updating || loading)
      && (hasMore || this.props.hasMore)
    ) {
      let {top, skip} = this.props.dataPagination;
      this.props.onDataPagination({top, skip: skip + top});
    }
  },

  _recomputeGeometry() {
    let {height, width} = this.getDOMNode().getBoundingClientRect();
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
    let {selected} = this.props;
    let row = this._rowGetter(rowIndex);
    if (row && row.id == selected) { // eslint-disable-line eqeqeq
      return classNames.rowSelected;
    }
  },

  _onRowClick(e, rowIndex, row) {
    let {selected, onSelected} = this.props;
    if (row.id != selected) { // eslint-disable-line eqeqeq
      onSelected(row.id, row);
    }
  }
});

/**
 * Render null and undefined as empty string but get toString from any other
 * object.
 */
function renderToString(value) {
  return value == null ?  '' : String(value); // eslint-disable-line eqeqeq
}

export default DataTable;
