/**
 * @flow
 **/

import React from 'react'
import ReactDOM from 'react-dom'
import shallowCompare from 'react-addons-shallow-compare'
import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox} from '@prometheusresearch/react-box';
import CogIcon from 'react-icons/lib/fa/cog';
import EllipsisIcon from 'react-icons/lib/fa/ellipsis-v';
import {style} from 'react-stylesheet';
import * as css from 'react-stylesheet/css';
import {Grid} from 'react-virtualized'

let DataTableRow = style('div', {
  displayName: 'DataTableRow',
  base: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: '11pt',
    borderBottom: css.border(1, '#eee'),
    overflow: 'hidden',
    hover: {
      background: '#fafafa',
    }
  }
});

let DataTableHeaderRow = style('div', {
  displayName: 'DataTableHeaderRow',
  base: {
    fontSize: '11pt',
    fontWeight: 400,
    marginBottom: 2,
    boxShadow: css.boxShadow(0, 0, 3, 0, '#666'),
    position: css.position.relative,
    textTransform: css.textTransform.none,

    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
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

    marginRight: 10,
    firstOfType: {
      marginLeft: 34,
    }
  }
});

let DataTableHeaderRowColumn = style('div', {
  displayName: 'DataTableHeaderRowColumn',
  base: {
    position: 'relative',
    height: '100%',
    minWidth: 0,

    paddingRight: 10,
    paddingLeft: 10,

    marginRight: 10,
    firstOfType: {
      marginLeft: 10,
    },

    borderRight: css.border(1, '#eee'),
  }
});

let DataTableHeaderRowColumnCell = style('span', {
  displayName: 'DataTableHeaderRowColumnCell',
  base: {
    fontWeight: 300,
    display: css.display.inlineBlock,
    maxWidth: '100%',
    whiteSpace: css.whiteSpace.nowrap,
    textOverflow: css.textOverflow.ellipsis,
    overflow: css.overflow.hidden,
    position: css.position.absolute,
    bottom: 5,
    paddingRight: 20,
  }
});

let DataTableHeaderMenuButton = style(VBox, {
  base: {
    color: '#ccc',
    cursor: 'pointer',
    hover: {
      color: 'currentColor',
    }
  }
});

type DataTableHeaderProps = {
  columns: Array<any>;
  height: number;
  width: number;
  scrollbarWidth: number;
  onAddColumn: () => *;
};

function DataTableHeader({
  columns,
  height,
  width,
  scrollbarWidth,
  onAddColumn,
}: DataTableHeaderProps) {
  let items = columns.map((column, index) => {
    const {label} = column;
    const style = getColumnStyle(column)
    return (
      <DataTableHeaderRowColumn
        key={`Header-Col${index}`}
        style={style}>
        <DataTableHeaderRowColumnCell
          key="label"
          title={label}>
          {label}
        </DataTableHeaderRowColumnCell>
        <DataTableHeaderMenuButton position="absolute" right={2} bottom={6}>
          <EllipsisIcon />
        </DataTableHeaderMenuButton>
      </DataTableHeaderRowColumn>
    );
  });
  return (
    <DataTableHeaderRow
      style={{
        height, width,
        paddingRight: scrollbarWidth,
      }}>
      <VBox width={34} paddingH={2} alignSelf="flex-end">
        <ReactUI.QuietButton
          onClick={onAddColumn}
          size="small"
          icon={<CogIcon />}
          />
      </VBox>
      {items}
    </DataTableHeaderRow>
  );
}

type DataTableProps = {

  columns: Array<any>;

  onAddColumn: () => *;

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

  render () {
    const {
      columns,
      disableHeader,
      headerHeight,
      noRowsRenderer,
      scrollToIndex,
      style,
      height,
      width,
      onAddColumn,
    } = this.props
    const { scrollbarWidth } = this.state

    const availableRowsHeight = height - headerHeight

    // Precompute and cache column styles before rendering rows and columns to
    // speed things up
    this._cachedColumnStyles = []
    columns.forEach((column, index) => {
      let style = getColumnStyle(column);
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
            onAddColumn={onAddColumn}
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
    column: any;
    columnIndex: number;
    isScrolling: boolean;
    rowData: Object;
    rowIndex: number;
  }) => {
    const {
      cellDataGetter,
      cellRenderer,
      columnData,
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
      column,
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
      columns,
      rowGetter,
      rowHeight,
    } = this.props

    const {scrollbarWidth} = this.state

    const rowData = rowGetter({ index })

    const items = columns.map(
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

function getColumnStyle(column: any) {
  let {flexGrow = 0, flexShrink = 1, width, maxWidth, minWidth} = column;
  let flex = `${flexGrow} ${flexShrink} ${width}px`;
  let style = {
    flex: flex,
    msFlex: flex,
    WebkitFlex: flex,
    maxWidth: maxWidth,
    minWidth: minWidth,
  }
  return style;
}
