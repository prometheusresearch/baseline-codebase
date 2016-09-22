/**
 * @flow
 **/

import React from 'react'
import ReactDOM from 'react-dom'
import shallowCompare from 'react-addons-shallow-compare'
import {style} from 'react-dom-stylesheet';
import {Grid} from 'react-virtualized'

let DataTableRow = style('div', {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

let DataTableHeaderRow = style('div', {
  fontWeight: 700,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

let DataTableRowColumn = style('div', {
  marginRight: 10,
  minWidth: 0,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  firstOfType: {
    marginLeft: 10,
  }
});

let DataTableHeaderRowColumn = style('div', {
  marginRight: 10,
  minWidth: 0,
  firstOfType: {
    marginLeft: 10,
  }
});

type DataTableProps = {

  children: React.Element<*>;

  /**
    * Removes fixed height from the scrollingContainer so that the total height
    * of rows can stretch the window. Intended for use with WindowScroller
    */
  autoHeight?: boolean;

  /** Optional CSS class name */
  className?: string;

  /** Disable rendering the header at all */
  disableHeader?: boolean;

  /**
    * Used to estimate the total height of a Table before all of its rows have actually been measured.
    * The estimated total height is adjusted as rows are rendered.
    */
  estimatedRowSize: number;

  /** Optional custom CSS class name to attach to inner Grid element. */
  gridClassName?: string;

  /** Optional inline style to attach to inner Grid element. */
  gridStyle?: Object;

  /** Optional CSS class to apply to all column headers */
  headerClassName?: string;

  /** Fixed height of header row */
  headerHeight: number;

  /** Fixed/available height for out DOM element */
  height: number;

  /** Optional renderer to be used in place of table body rows when rowCount is 0 */
  noRowsRenderer?: Function;

  /** Optional custom inline style to attach to table header columns. */
  headerStyle?: Object;

  /**
    * Number of rows to render above/below the visible bounds of the list.
    * These rows can help for smoother scrolling on touch devices.
    */
  overscanRowCount?: number;

  /**
    * Optional CSS class to apply to all table rows (including the header row).
    * This property can be a CSS class name (string) or a function that returns a class name.
    * If a function is provided its signature should be: ({ index: number }): string
    */
  rowClassName?: string | Function;

  /**
    * Callback responsible for returning a data row given an index.
    * ({ index: number }): any
    */
  rowGetter: Function;

  /**
    * Either a fixed row height (number) or a function that returns the height of a row given its index.
    * ({ index: number }): number
    */
  rowHeight: number | Function;

  /** Number of rows in table. */
  rowCount: number;

  /** Optional custom inline style to attach to table rows. */
  rowStyle: Object | Function;

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
};

type DataTableState = {
  scrollbarWidth: number;
};

export default class DataTable extends React.Component<*, DataTableProps, *> {

  Grid: Grid;
  _cachedColumnStyles: Array<any>;

  state: DataTableState;

  static defaultProps = {
    disableHeader: false,
    estimatedRowSize: 30,
    headerHeight: 0,
    headerStyle: {},
    noRowsRenderer: () => null,
    overscanRowCount: 10,
    rowStyle: {},
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

  render () {
    const {
      children,
      className,
      disableHeader,
      gridClassName,
      gridStyle,
      headerHeight,
      height,
      noRowsRenderer,
      rowClassName,
      rowStyle,
      scrollToIndex,
      style,
      width
    } = this.props
    const { scrollbarWidth } = this.state

    const availableRowsHeight = height - headerHeight

    const rowClass = rowClassName instanceof Function ? rowClassName({ index: -1 }) : rowClassName
    const rowStyleObject = rowStyle instanceof Function ? rowStyle({ index: -1 }) : rowStyle

    // Precompute and cache column styles before rendering rows and columns to speed things up
    this._cachedColumnStyles = []
    React.Children.toArray(children).forEach((column, index) => {
      const flexStyles = this._getFlexStyleForColumn(column, column.props.style)

      this._cachedColumnStyles[index] = {
        ...flexStyles,
        overflow: 'hidden'
      }
    })

    // Note that we specify :numChildren, :scrollbarWidth, :sortBy, and :sortDirection as properties on Grid even though these have nothing to do with Grid.
    // This is done because Grid is a pure component and won't update unless its properties or state has changed.
    // Any property that should trigger a re-render of Grid then is specified here to avoid a stale display.
    return (
      <div
        className={className}
        style={style}
      >
        {!disableHeader && (
          <DataTableHeaderRow
            className={rowClass}
            style={{
              ...rowStyleObject,
              height: headerHeight,
              overflow: 'hidden',
              paddingRight: scrollbarWidth,
              width: width
            }}>
            {this._getRenderedHeaderRow()}
          </DataTableHeaderRow>
        )}

        <Grid
          {...this.props}
          autoContainerWidth
          className={gridClassName}
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
          style={gridStyle}
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
    column: React.Element<any>;
    columnIndex: number;
    isScrolling: boolean;
    rowData: Object;
    rowIndex: number;
  }) => {
    const {
      cellDataGetter,
      cellRenderer,
      className,
      columnData,
      dataKey
    } = column.props

    const cellData = cellDataGetter({ columnData, dataKey, rowData })
    const renderedCell = cellRenderer({ cellData, columnData, dataKey, isScrolling, rowData, rowIndex })

    const style = this._cachedColumnStyles[columnIndex]

    const title = typeof renderedCell === 'string'
      ? renderedCell
      : null

    return (
      <DataTableRowColumn
        key={`Row${rowIndex}-Col${columnIndex}`}
        className={className}
        style={style}
        title={title}>
        {renderedCell}
      </DataTableRowColumn>
    )
  };

  _createHeader({
    column,
    index
  }: {
    column: React.Element<any>;
    index: number;
  }) {
    const { headerClassName, headerStyle, } = this.props
    const { dataKey, disableSort, headerRenderer, label, columnData } = column.props

    const style = this._getFlexStyleForColumn(column, headerStyle)

    const renderedHeader = headerRenderer({
      columnData,
      dataKey,
      disableSort,
      label,
    })

    const a11yProps = {}

    return (
      <DataTableHeaderRowColumn
        {...a11yProps}
        key={`Header-Col${index}`}
        className={headerClassName}
        style={style}
      >
        {renderedHeader}
      </DataTableHeaderRowColumn>
    )
  }

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
      children,
      rowClassName,
      rowGetter,
      rowStyle
    } = this.props

    const { scrollbarWidth } = this.state

    const rowClass = rowClassName instanceof Function ? rowClassName({ index }) : rowClassName
    const rowStyleObject = rowStyle instanceof Function ? rowStyle({ index }) : rowStyle
    const rowData = rowGetter({ index })

    const columns = React.Children.toArray(children).map(
      (column, columnIndex) => this._createColumn({
        column,
        columnIndex,
        isScrolling,
        rowData,
        rowIndex: index,
        scrollbarWidth
      })
    )

    const className = rowClass;
    const flattenedStyle = {
      ...style,
      ...rowStyleObject,
      height: this._getRowHeight(index),
      overflow: 'hidden',
      paddingRight: scrollbarWidth
    }

    return (
      <DataTableRow
        className={className}
        key={key}
        style={flattenedStyle}>
        {columns}
      </DataTableRow>
    );
  };

  /**
   * Determines the flex-shrink, flex-grow, and width values for a cell (header or column).
   */
  _getFlexStyleForColumn(column: any, customStyle: Object = {}) {
    const flexValue = `${column.props.flexGrow} ${column.props.flexShrink} ${column.props.width}px`

    const style = {
      ...customStyle,
      flex: flexValue,
      msFlex: flexValue,
      WebkitFlex: flexValue
    }

    if (column.props.maxWidth) {
      style.maxWidth = column.props.maxWidth
    }

    if (column.props.minWidth) {
      style.minWidth = column.props.minWidth
    }

    return style
  }

  _getRenderedHeaderRow () {
    const { children, disableHeader } = this.props
    const items = disableHeader ? [] : React.Children.toArray(children)

    return items.map((column, index) =>
      this._createHeader({ column, index })
    )
  }

  _getRowHeight(rowIndex: number) {
    const {rowHeight} = this.props

    return rowHeight instanceof Function
      ? rowHeight({ index: rowIndex })
      : rowHeight
  }

  _setScrollbarWidth () {
    const Grid = ReactDOM.findDOMNode(this.Grid)
    const clientWidth = Grid.clientWidth || 0
    const offsetWidth = Grid.offsetWidth || 0
    const scrollbarWidth = offsetWidth - clientWidth

    this.setState({ scrollbarWidth })
  }
}

