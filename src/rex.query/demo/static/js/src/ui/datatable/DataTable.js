/**
 * @flow
 **/

import React from 'react'
import ReactDOM from 'react-dom'
import shallowCompare from 'react-addons-shallow-compare'
import {style} from 'react-stylesheet';
import {Grid} from 'react-virtualized'

import computeColumnStyle from './computeColumnStyle';
import DataTableHeader from './DataTableHeader';
import getColumnSpecList from './getColumnSpecList';

export type ColumnSpec<T> = {
  dataKey: Array<string>;
  cellRenderer?: CellRenderer<T>;
  cellDataGetter?: CellDataGetter<T>;
  headerCellRenderer?: HeaderCellRenderer<T>;
  width?: number;
  label?: string;
  flexGrow?: number;
  flexShrink?: number;
  minWidth?: number;
  maxWidth?: number;
  data: T;
};

type ColumnSize = {
  width: number;
  height: number;
};

export type ColumnStack<T> = {
  type: 'stack';
  size: ColumnSize;
  stack: Array<ColumnConfig<T>>;
};

export type ColumnGroup<T> = {
  type: 'group';
  size: ColumnSize;
  group: Array<ColumnConfig<T>>;
};

export type ColumnField<T> = {
  type: 'field';
  size: ColumnSize;
  field: ColumnSpec<T>;
};

export type ColumnConfig<T>
  = ColumnStack<T>
  | ColumnGroup<T>
  | ColumnField<T>;

export type CellDataGetter<T> = (
  props: {
    rowData: mixed;
    columnData: T;
    dataKey: Array<string>;
  }
) => mixed;

export type CellRenderer<T> = (
  props: {
    cellData: mixed;
    rowData: mixed;
    columnData: T;
    dataKey: Array<string>;
    isScrolling: boolean;
    rowIndex: number;
  }
) => ?string | React.Element<any>;

export type HeaderCellRenderer<T> = (
  props: {
    column: ColumnField<T>;
    onClick?: (column: ColumnField<T>) => *;
    style: Object;
  }
) => React.Element<any>;

let DataTableRow = style('div', {
  displayName: 'DataTableRow',
  base: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: '11pt',
    overflow: 'hidden',
    hover: {
      background: '#fafafa',
    }
  }
});

let DataTableRowColumn = style('div', {
  displayName: 'DataTableRowColumn',
  base: {
    minWidth: 0,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#333',
    fontSize: '10pt',
    fontWeight: 200,

    paddingRight: 10,
    paddingLeft: 10,
  }
});

type DataTableProps = {

  columns: ColumnConfig<*>;

  /**
    * Removes fixed height from the scrollingContainer so that the total height
    * of rows can stretch the window. Intended for use with WindowScroller
    */
  autoHeight?: boolean;

  /** Disable rendering the header at all */
  disableHeader?: boolean;

  /**
    * Used to estimate the total height of a Table before all of its rows have actually been measured.
    * The estimated total height is adjusted as rows are rendered.
    */
  estimatedRowSize: number;

  /** Fixed height of header row */
  headerHeight: number;

  /** Fixed/available height for out DOM element */
  height: number;

  /** Optional renderer to be used in place of table body rows when rowCount is 0 */
  noRowsRenderer?: Function;

  /**
    * Number of rows to render above/below the visible bounds of the list.
    * These rows can help for smoother scrolling on touch devices.
    */
  overscanRowCount?: number;

  /**
    * Callback responsible for returning a data row given an index.
    * ({ index: number }): any
    */
  rowGetter: Function;

  /**
    * Either a fixed row height (number) or a function that returns the height of a row given its index.
    * ({ index: number }): number
    */
  rowHeight: number;

  /** Number of rows in table. */
  rowCount: number;

  /** See Grid#scrollToAlignment */
  scrollToAlignment: 'auto' | 'end' | 'start' | 'center';

  /** Row index to ensure visible (by forcefully scrolling if necessary) */
  scrollToIndex?: number;

  /** Vertical offset. */
  scrollTop?: number;

  /** Optional inline style */
  style?: Object;

  /** Tab index for focus */
  tabIndex?: number;

  /** Width of list */
  width: number;

  onColumnClick?: (column: ColumnField<*>) => *;
};

type DataTableState = {
  scrollbarWidth: number;
};

export default class DataTable extends React.Component<*, DataTableProps, *> {

  Grid: Grid;
  _cachedColumnStyles: Array<any>;
  _cachedColumnSpecList: Array<ColumnSpec<*>>;

  state: DataTableState;

  static defaultProps = {
    disableHeader: false,
    estimatedRowSize: 30,
    headerHeight: 0,
    noRowsRenderer: () => null,
    overscanRowCount: 10,
    scrollToAlignment: 'auto',
    style: {}
  };

  _cachedColumnStyles = [];

  state = {
    scrollbarWidth: 0
  };

  forceUpdateGrid() {
    this.Grid.forceUpdate()
  }

  measureAllRows() {
    this.Grid.measureAllCells()
  }

  recomputeRowHeights(index: number = 0) {
    this.Grid.recomputeGridSize({
      rowIndex: index
    })
    this.forceUpdateGrid()
  }

  componentDidMount () {
    this._setScrollbarWidth()
  }

  componentDidUpdate () {
    this._setScrollbarWidth()
  }

  render() {
    let {
      columns,
      disableHeader,
      headerHeight,
      noRowsRenderer,
      scrollToIndex,
      style,
      height,
      width,
      onColumnClick,
    } = this.props
    const { scrollbarWidth } = this.state

    const availableRowsHeight = height - (headerHeight * columns.size.height);

    // Precompute and cache column styles before rendering rows and columns to
    // speed things up
    this._cachedColumnStyles = []
    this._cachedColumnSpecList = getColumnSpecList(columns);

    this._cachedColumnSpecList.forEach((column, index) => {
      let style = computeColumnStyle(column);
      this._cachedColumnStyles[index] = {...style, overflow: 'hidden'};
    })

    // Note that we specify :numChildren, :scrollbarWidth, :sortBy, and
    // :sortDirection as properties on Grid even though these have nothing to do
    // with Grid.  This is done because Grid is a pure component and won't
    // update unless its properties or state has changed. Any property that
    // should trigger a re-render of Grid then is specified here to avoid a
    // stale display.
    return (
      <div
        style={style}>
        {!disableHeader && (
          <DataTableHeader
            height={headerHeight}
            width={width}
            scrollbarWidth={scrollbarWidth}
            columns={columns}
            onColumnClick={onColumnClick}
            />
        )}
        <Grid
          {...this.props}
          autoContainerWidth
          style={{outline: 'none'}}
          cellRenderer={this._createRow}
          columnWidth={width}
          columnCount={1}
          height={availableRowsHeight}
          noContentRenderer={noRowsRenderer}
          ref={(ref) => {
            this.Grid = ref
          }}
          scrollbarWidth={scrollbarWidth}
          scrollToRow={scrollToIndex}
        />
      </div>
    )
  }

  shouldComponentUpdate(nextProps: DataTableProps, nextState: DataTableState) {
    return shallowCompare(this, nextProps, nextState)
  }

  _createColumn = ({
    column,
    columnIndex,
    isScrolling,
    rowData,
    rowIndex
  }: {
    column: ColumnSpec<*>;
    columnIndex: number;
    isScrolling: boolean;
    rowData: Object;
    rowIndex: number;
  }) => {
    const {
      cellDataGetter = defaultCellDataGetter,
      cellRenderer = defaultCellRenderer,
      data: columnData,
      dataKey
    } = column;

    const cellData = cellDataGetter({
      columnData,
      dataKey,
      rowData
    });

    const renderedCell = cellRenderer({
      cellData,
      columnData,
      dataKey,
      isScrolling,
      rowData,
      rowIndex,
    });

    const style = this._cachedColumnStyles[columnIndex]

    const title = typeof renderedCell === 'string'
      ? renderedCell
      : null

    return (
      <DataTableRowColumn
        key={`Row${rowIndex}-Col${columnIndex}`}
        style={style}
        title={title}>
        {renderedCell}
      </DataTableRowColumn>
    )
  };

  _createRow = ({
    rowIndex: index,
    isScrolling,
    key,
    style
  }: {
    rowIndex: number;
    isScrolling: boolean;
    key: string;
    style: Object;
  }) => {
    const {
      rowGetter,
      rowHeight,
    } = this.props

    const {scrollbarWidth} = this.state

    const rowData = rowGetter({ index })

    const items = this._cachedColumnSpecList.map(
      (column, columnIndex) => this._createColumn({
        column,
        columnIndex,
        isScrolling,
        rowData,
        rowIndex: index,
        scrollbarWidth
      })
    )

    const flattenedStyle = {
      ...style,
      height: rowHeight,
      paddingRight: scrollbarWidth
    }

    return (
      <DataTableRow
        key={key}
        style={flattenedStyle}>
        {items}
      </DataTableRow>
    );
  };

  _setScrollbarWidth () {
    const Grid = ReactDOM.findDOMNode(this.Grid)
    const clientWidth = Grid.clientWidth || 0
    const offsetWidth = Grid.offsetWidth || 0
    const scrollbarWidth = offsetWidth - clientWidth
    this.setState({scrollbarWidth})
  }
}

function defaultCellDataGetter({rowData, dataKey}) {
  return dataKey.length > 0 && rowData != null && typeof rowData === 'object'
    ? getByKey(rowData, dataKey)
    : rowData;
}

function defaultCellRenderer({cellData}) {
  if (cellData == null) {
    return '';
  } else {
    return String(cellData)
  }
}

export function getByKey(item: Object, dataKey: Array<string>) {
  if (dataKey.length === 0) {
    return item;
  } else if (dataKey.length === 1) {
    if (item.__index__ != null && item.__index__ !== 0) {
      return undefined;
    }
    return item[dataKey[0]];
  } else if (dataKey.length === 2) {
    item = item[dataKey[0]];
    if (item == null) {
      return item;
    }
    if (item.__index__ != null && item.__index__ !== 0) {
      return undefined;
    }
    return item[dataKey[1]];
  } else {
    for (let i = 0; i < dataKey.length; i++) {
      item = item[dataKey[i]];
      if (item == null) {
        return item;
      }
    }
    return item;
  }
}
