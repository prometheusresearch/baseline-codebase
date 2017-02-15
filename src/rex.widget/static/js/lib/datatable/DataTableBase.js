/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Style from './DataTableBase.css';

import React, {PropTypes} from 'react';
import {Column, Table} from 'fixed-data-table';
import * as Stylesheet from '../../stylesheet';
import * as css from '../../css';
import WithDOMSize from '../ui/WithDOMSize';
import {VBox, HBox} from '../../layout';
import {emptyFunction} from '../../lang';
import {LoadingIndicator, Icon} from '../ui';
import * as KeyPath       from '../KeyPath';
import TouchableArea      from '../TouchableArea';
import ZyngaScroller      from '../Scroller';
import {isTouchDevice}    from '../Environment';

export class DataTableBase extends React.Component {

  static propTypes = {
    /**
     * DataSet to render.
     */
    data: PropTypes.object.isRequired,

    /**
     * An array of column specifications.
     */
    columns: PropTypes.array.isRequired,

    /**
     * Current pagination position {top: ..., skip: ...}
     */
    pagination: PropTypes.object,

    /**
     * Callback which is called on next pagination position.
     */
    onPagination: PropTypes.func,

    /**
     * Current sort direction.
     */
    sort: PropTypes.object,

    /**
     * Callback which is called on next sort direction.
     */
    onSort: PropTypes.func,

    /**
     * Wrapper DOM size, will be determined automatically if not provided.
     */
    DOMSize: PropTypes.object,

    /**
     * Minimum value for column width.
     */
    minColumnWidth: PropTypes.number,

    /**
     * Height of the datatable header.
     */
    headerHeight: PropTypes.number,

    /**
     * Height of the datatable row.
     */
    rowHeight: PropTypes.number,
  };

  static defaultProps = {
    top: 50,
    skip: 0,
    minColumnWidth: 90,
    rowHeight: 35,
    headerHeight: 35,
    pagination: {top: 50, skip: 0},
    sort: {valueKey: null, asc: true},
    onSort: emptyFunction,
    onSelect: emptyFunction,
    selectedRowClassName: Style.rowSelected
  };

  static stylesheet = Stylesheet.create({
    Root: {
      Component: VBox,
      overflow: 'hidden',
      margin: '20px 19px 0px 20px',
    },
    LoadingPane: {
      Component: VBox,
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
      visible: {
        bottom: 10,
        opacity: 100
      }
    },
    SortIndicator: {
      Component: VBox,
      cursor: 'pointer',
      color: '#bbb',
      fontSize: '70%',
      justifyContent: 'center',

      hover: {
        color: '#666'
      },
      active: {
        color: '#666'
      }
    },
    ErrorInfo: {
      Component: VBox,
      color: '#a94442',
      backgroundColor: '#f2dede',
      borderColor: '#ebccd1',

      padding: 10,
      maxHeight: 100,

      position: 'absolute',
      zIndex: 1001,
      left: 0,
      right: 0,
      bottom: 0,
      boxShadow: '0px -2px 4px 0px rgb(204, 204, 204)'
    }
  });

  constructor(props) {
    super(props);
    this._rowIndexMax = null;
    this.state = {
      columnWidth: {},
      left: 0,
      top: 0
    };
    this.scroller = null;
    if (isTouchDevice) {
      this.scroller = new ZyngaScroller(this.onTouchScroll);
    }
  }

  render() {
    let {
      DOMSize,
      rowHeight,
      headerHeight,
      minColumnWidth,
      columns,
      sort,
      style,
      data: {data, updating, error}
    } = this.props;
    let {Root, ErrorInfo, LoadingPane} = this.constructor.stylesheet;
    if (!this.props.DOMSize) {
      return <Root style={style} flex={1} />;
    }
    let rowsCount = data ? data.length : 0;
    let columnElements = [];

    let columnWidth = Math.max(Math.floor(DOMSize.width / columns.length), minColumnWidth);
    for (let i = 0; i < columns.length; i++) {
      let column = {...columns[i]};
      if (column.sortable === undefined) {
        column.sortable = true;
      }
      columnElements.push(
        <Column
          key={column.valueKey}
          width={this.state.columnWidth[column.valueKey] || column.width || columnWidth}
          cellDataGetter={this.cellDataGetter}
          cellRenderer={this.cellRenderer}
          headerRenderer={this.headerRenderer}
          fixed={column.fixed}
          dataKey={column.valueKey.join('.')}
          label={column.label || KeyPath.normalize(column.valueKey).join('.')}
          columnData={{...column, sort}}
          isResizable={true}
          />
      );
    }
    return (
      <TouchableArea
        element={Root}
        flex={1}
        scroller={isTouchDevice ? this.scroller : undefined}
        style={{...style, cursor: 'pointer'}}>
        <Table
          onContentHeightChange={
            isTouchDevice ?
              this.onContentDimensionsChange :
              undefined}
          scrollTop={isTouchDevice ? this.state.top : undefined}
          scrollLeft={isTouchDevice ? this.state.left : undefined}
          overflowX={isTouchDevice ? 'hidden' : 'auto'}
          overflowY={isTouchDevice ? 'hidden' : 'auto'}
          headerHeight={headerHeight}
          rowHeight={rowHeight}
          height={DOMSize.height}
          width={DOMSize.width}
          rowGetter={this.rowGetter}
          rowClassNameGetter={this.rowClassNameGetter}
          onRowClick={this.onRowClick}
          onScrollEnd={this.onScrollEnd}
          onColumnResizeEndCallback={this.onColumnResizeEndCallback}
          isColumnResizing={false}
          rowsCount={rowsCount}>
          {columnElements}
        </Table>
        <LoadingPane variant={{visible: updating}}>
          <LoadingIndicator />
        </LoadingPane>
        {error && <ErrorInfo>{error.message}</ErrorInfo>}
      </TouchableArea>
    );
  }

  onTouchScroll = (left, top) => {
    if (isTouchDevice) {
      this.setState({left, top});
      this.onScrollEnd();
    }
  };

  onContentDimensionsChange = (contentHeight, contentWidth) => {
    if (isTouchDevice) {
      this.scroller.setDimensions(
        this.props.DOMSize.width,
        this.props.DOMSize.height,
        contentWidth,
        contentHeight
      );
    }
  };

  onColumnResizeEndCallback = (newWidth, dataKey) => {
    newWidth = Math.max(this.props.minColumnWidth, newWidth);
    let columnWidth = {...this.state.columnWidth, [dataKey]: newWidth};
    this.setState({columnWidth});
  };

  headerRenderer = (label, cellDataKey, columnData) => {
    let {SortIndicator} = this.constructor.stylesheet;
    let {sort: sortSpec, onSort} = this.props;
    let {valueKey, asc} = sortSpec;
    let active = KeyPath.equals(columnData.valueKey, valueKey);
    let sort = {valueKey: columnData.valueKey, asc: active ? !asc : true};
    let icon = active ? (asc ? 'sort-by-attributes' : 'sort-by-attributes-alt') : 'sort';
    return (
      <div>
        <HBox flex={1}>
          <VBox flex={1}>
            {label}
          </VBox>
          {columnData.sortable &&
            <SortIndicator onClick={onSort.bind(null, sort)}>
              <Icon name={icon} />
            </SortIndicator>}
        </HBox>
      </div>
    );
  };

  cellRenderer = (cellData, cellDataKey, rowData, rowIndex, columnData) => {
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
  };

  cellDataGetter = (cellDataKey, rowData) => {
    return KeyPath.get(cellDataKey, rowData);
  };

  rowGetter = (rowIndex) => {
    if (rowIndex > this._rowIndexMax) {
      this._rowIndexMax = rowIndex;
    }
    let rowData = this.props.data.data[rowIndex];
    return rowData;
  };

  rowClassNameGetter = (rowIndex) => {
    let {selected} = this.props;
    let row = this.rowGetter(rowIndex);
    if (row && row.id !== undefined && row.id == selected) { // eslint-disable-line eqeqeq
      return this.props.selectedRowClassName;
    }
  };

  onScrollEnd = () => {
    let {
      pagination: {top, skip},
      data: {updating, hasMore, data}
    } = this.props;
    if (data && data.length - this._rowIndexMax < 10 && !updating && hasMore) {
      this.props.onPagination({top, skip: skip + top});
    }
  };

  onRowClick = (e, rowIndex, row) => {
    let {allowReselect, selected, onSelect} = this.props;
    if (allowReselect || row.id != selected) { // eslint-disable-line eqeqeq
      onSelect(row.id, row);
    }
  };
}

/**
 * Render null and undefined as empty string but get toString from any other
 * object.
 */
function renderToString(value) {
  return value == null ?  '' : String(value);
}

export default WithDOMSize(DataTableBase);
