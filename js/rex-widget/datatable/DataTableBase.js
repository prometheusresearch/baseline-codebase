/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import Style from "./DataTableBase.css";

import invariant from "invariant";
import * as React from "react";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";
import { Column, Cell as CellBase, Table } from "fixed-data-table-2";
import { VBox, HBox } from "react-stylesheet";
import { emptyFunction } from "../lang";
import { type DataSet } from "../data";
import { Icon } from "../ui";
import * as KeyPath from "../KeyPath";
import { TouchableArea, Scroller } from "../ui";
import { isTouchDevice } from "../Environment";
import { WithDOMSize } from "rex-ui/Layout";
import * as ReactUtil from "rex-ui/ReactUtil";
import * as css from "rex-ui/css";

export type SortDirection = {
  valueKey: KeyPath.keypath,
  asc: boolean
};

export type Pagination = {
  top: number,
  skip: number
};

export type Row = {
  id: string
};

type Props = {|
  /**
   * DataSet to render.
   */
  data: DataSet<Row[]>,

  /**
   * An array of column specifications.
   */
  columns: Column[],

  /**
   * Current pagination position {top: ..., skip: ...}
   */
  pagination: Pagination,

  /**
   * Callback which is called on next pagination position.
   */
  onPagination: Pagination => void,

  /**
   * Current sort direction.
   */
  sort: SortDirection,

  /**
   * Callback which is called on next sort direction.
   */
  onSort: SortDirection => void,

  /**
   * Wrapper DOM size, will be determined automatically if not provided.
   */
  DOMSize?: { width: number, height: number },
  setElementForDOMSize: React.Ref<any>,

  /**
   * Minimum value for column width.
   */
  minColumnWidth: number,

  /**
   * Height of the datatable header.
   */
  headerHeight: number,

  /**
   * Height of the datatable row.
   */
  rowHeight: number,

  selected?: ?string,
  onSelect?: (?string, ?Row) => void,
  allowReselect?: boolean,

  onCellClick?: (string, mixed, mixed) => void,

  selectedRowClassName?: string
|};

type State = {
  columnWidth: { [name: string]: number },
  left: number,
  top: number
};

export class DataTableBase extends React.Component<Props, State> {
  static defaultProps = {
    minColumnWidth: 90,
    rowHeight: 35,
    headerHeight: 35,
    pagination: { top: 50, skip: 0 },
    sort: { valueKey: null, asc: true },
    selectedRowClassName: Style.rowSelected
  };

  _rowIndexMax: number;

  constructor(props: Props) {
    super(props);
    this._rowIndexMax = 0;
    this.state = {
      columnWidth: {},
      left: 0,
      top: 0
    };
  }

  render() {
    let {
      DOMSize,
      setElementForDOMSize,
      rowHeight,
      headerHeight,
      minColumnWidth,
      columns,
      sort,
      onSort,
      onCellClick,
      data: { data, updating, error }
    } = this.props;
    if (DOMSize == null) {
      return <VBox ref={setElementForDOMSize} flexShrink={1} flexGrow={1} />;
    }
    let rowsCount = data ? data.length : 0;
    let columnElements = [];

    let columnWidth = Math.max(
      Math.floor(DOMSize.width / columns.length),
      minColumnWidth
    );
    for (let i = 0; i < columns.length; i++) {
      let column = { ...columns[i] };
      if (column.sortable === undefined) {
        column.sortable = true;
      }
      let width =
        this.state.columnWidth[column.valueKey] || column.width || columnWidth;
      let columnKey = column.valueKey.join(".");
      columnElements.push(
        <Column
          key={columnKey}
          columnKey={columnKey}
          width={width}
          header={
            <Header
              dataKey={columnKey}
              sortDirection={sort}
              onSortDirection={onSort}
              columnData={{ ...column, sort }}
              label={
                column.label || KeyPath.normalize(column.valueKey).join(".")
              }
            />
          }
          cell={props => (
            <Cell
              {...props}
              rowGetter={this.rowGetter}
              cellDataGetter={this.cellDataGetter}
              dataKey={columnKey}
              onCellClick={onCellClick}
              columnData={{ ...column, sort }}
            />
          )}
          fixed={column.fixed}
          isResizable={true}
        />
      );
    }

    return (
      <VBox
        ref={
          isTouchDevice
            ? this.preventTouchMoveAndSetElementForDOMSize
            : setElementForDOMSize
        }
        flexGrow={1}
        flexShrink={1}
        style={{
          touchAction: "none",
          cursor: "pointer",
          overflow: "hidden"
        }}
      >
        <Table
          touchScrollEnabled={isTouchDevice}
          headerHeight={headerHeight}
          rowHeight={rowHeight}
          height={DOMSize.height}
          width={DOMSize.width}
          rowClassNameGetter={this.rowClassNameGetter}
          onRowClick={this.onRowClick}
          onScrollEnd={this.onScrollEnd}
          onColumnResizeEndCallback={this.onColumnResizeEndCallback}
          isColumnResizing={false}
          rowsCount={rowsCount}
        >
          {columnElements}
        </Table>
        <LoadingPane show={updating} />
        {error && <ErrorInfo>{error.message}</ErrorInfo>}
      </VBox>
    );
  }

  _root: ?HTMLElement = null;

  preventDefault = (e: UIEvent) => e.preventDefault();
  preventDefaultOptions = { passive: false };

  preventTouchMoveAndSetElementForDOMSize = (component: any) => {
    ReactUtil.setReactRef(this.props.setElementForDOMSize, component);
    if (component != null) {
      let root = ReactUtil.findHTMLElement(component);
      invariant(
        root != null,
        "<DataTableBase />: Unable to get root DOM element"
      );
      this._root = root;
      this._root.addEventListener(
        "touchmove",
        this.preventDefault,
        this.preventDefaultOptions
      );
    } else if (this._root != null) {
      this._root.removeEventListener(
        "touchmove",
        this.preventDefault,
        this.preventDefaultOptions
      );
    }
  };

  onColumnResizeEndCallback = (newWidth: number, dataKey: string) => {
    newWidth = Math.max(this.props.minColumnWidth, newWidth);
    let columnWidth = { ...this.state.columnWidth, [dataKey]: newWidth };
    this.setState({ columnWidth });
  };

  cellDataGetter = (cellDataKey: string, rowData: Object) => {
    return KeyPath.get(cellDataKey, rowData);
  };

  rowGetter = (rowIndex: number) => {
    let { data } = this.props.data;
    if (rowIndex > this._rowIndexMax) {
      this._rowIndexMax = rowIndex;
    }
    if (data != null) {
      return data[rowIndex];
    } else {
      return {};
    }
  };

  rowClassNameGetter = (rowIndex: number) => {
    let { selected } = this.props;
    let row = this.rowGetter(rowIndex);
    if (row && row.id !== undefined && row.id == selected) {
      // eslint-disable-line eqeqeq
      return this.props.selectedRowClassName;
    }
  };

  onScrollEnd = () => {
    let {
      pagination: { top, skip },
      data: { updating, hasMore, data }
    } = this.props;
    if (data && data.length - this._rowIndexMax < 10 && !updating && hasMore) {
      this.props.onPagination({ top, skip: skip + top });
    }
  };

  onRowClick = (_e: Event, rowIndex: number) => {
    let row = this.rowGetter(rowIndex);
    let { allowReselect, selected, onSelect } = this.props;
    if ((allowReselect || row.id != selected) && onSelect != null) {
      onSelect(row.id, row);
    }
  };
}

let Cell = props => {
  let columnData = props.columnData;
  let rowData = props.rowGetter(props.rowIndex);
  let cellData = props.cellDataGetter(props.dataKey, rowData);
  let onCellClick;
  if (props.onCellClick != null) {
    onCellClick = props.onCellClick.bind(
      null,
      props.dataKey,
      cellData,
      rowData
    );
  }
  if (columnData.widget && columnData.widget.column) {
    return React.cloneElement(columnData.widget.column, {
      cellData,
      onCellClick
    });
  } else {
    let data = renderToString(cellData);
    return (
      <CellBase onClick={onCellClick}>
        <span title={data}>{data}</span>
      </CellBase>
    );
  }
};

let SortIndicator = ({
  sortDirection,
  onClick
}: {
  sortDirection: ?SortDirection,
  onClick: () => void
}) => {
  let iconStyle = { fontSize: "18px" };
  let icon = <icons.Sort style={iconStyle} />;
  if (sortDirection != null) {
    if (sortDirection.asc) {
      icon = <icons.ArrowDownward style={iconStyle} />;
    } else {
      icon = <icons.ArrowUpward style={iconStyle} />;
    }
  }
  let buttonStyle = {
    padding: 2,
    position: "absolute",
    right: 0,
    top: -2
  };
  return (
    <mui.IconButton style={buttonStyle} size="small" onClick={onClick}>
      {icon}
    </mui.IconButton>
  );
};

let Header = ({ columnData, sortDirection, onSortDirection, label }) => {
  let { valueKey, asc } = sortDirection;
  let active = KeyPath.equals(columnData.valueKey, valueKey);
  let handleOnSortDirection = React.useCallback(() => {
    let nextSortDirection = {
      valueKey: columnData.valueKey,
      asc: active ? !asc : true
    };
    if (onSortDirection) {
      onSortDirection(nextSortDirection);
    }
  }, [columnData.valueKey, active, asc, onSortDirection]);
  return (
    <CellBase style={{ width: "100%" }}>
      <HBox flexGrow={1}>
        <VBox flexGrow={1}>{label}</VBox>
        {columnData.sortable && (
          <SortIndicator
            onClick={handleOnSortDirection}
            sortDirection={active ? sortDirection : null}
          />
        )}
      </HBox>
    </CellBase>
  );
};

let LoadingPane = ({ show }) => {
  let style = {
    background: css.rgba(230, 0.7),
    position: "absolute",
    zIndex: 1000,
    left: "calc(50% - 30px)",
    height: 60,
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    bottom: -60,
    opacity: 0,
    transition: "opacity 0.3s",
    borderRadius: 30
  };
  if (show) {
    style = { ...style, bottom: 20, opacity: 100 };
  }
  return (
    <VBox style={style}>
      <mui.CircularProgress />
    </VBox>
  );
};

let ErrorInfo = props => {
  let style = {
    color: "#a94442",
    backgroundColor: "#f2dede",
    borderColor: "#ebccd1",

    padding: 10,
    maxHeight: 100,

    position: "absolute",
    zIndex: 1001,
    left: 0,
    right: 0,
    bottom: 0,
    boxShadow: "0px -2px 4px 0px rgb(204, 204, 204)"
  };
  return <VBox style={style} />;
};

/**
 * Render null and undefined as empty string but get toString from any other
 * object.
 */
function renderToString(value) {
  return value == null ? "" : String(value);
}

export default WithDOMSize(DataTableBase);
