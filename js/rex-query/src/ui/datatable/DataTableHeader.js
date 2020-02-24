/**
 * @flow
 **/

import type {
  ColumnConfig,
  ColumnField,
  ColumnContainerConfig
} from "./DataTable";

import * as React from "react";
import { style, css, VBox, HBox } from "react-stylesheet";

import findDOMNode from "../../findDOMNode";
import stopPropagation from "../../stopPropagation";
import DataTableHeaderCell, {
  DataTableHeaderCellResizeHandle
} from "./DataTableHeaderCell";

type DataTableHeaderProps = {
  columns: ColumnConfig<*>,
  columnWidth: (columnConfig: ColumnConfig<*>) => number,
  height: number,
  width: number,
  scrollbarWidth: number,
  onColumnResize?: (resize: { column: ColumnField<*>, width: number }) => *,
  onColumnClick?: (column: ColumnField<*>) => *,
  onColumnSort?: (column: ColumnField<*>) => *,
  headerCellProps?: {|
    renderColumnMenu?: (column: ColumnField<*>) => *,
    onColumnMenuSelect?: (column: ColumnField<*>, value: string) => *
  |}
};

export default function DataTableHeader(props: DataTableHeaderProps) {
  let {
    width,
    height,
    scrollbarWidth,
    onColumnClick,
    onColumnSort,
    onColumnResize,
    columns,
    columnWidth,
    headerCellProps
  } = props;
  return (
    <DataTableHeaderRoot
      style={{
        height: height * columns.size.height,
        width,
        paddingRight: scrollbarWidth
      }}
    >
      <DataTableHeaderItem
        columnSpec={columns}
        parentColumnSpec={null}
        index={null}
        columnWidth={columnWidth}
        height={height}
        onClick={onColumnClick}
        onSort={onColumnSort}
        onResize={onColumnResize}
        headerCellProps={headerCellProps}
      />
    </DataTableHeaderRoot>
  );
}

type DataTableHeaderItemProps = {
  columnSpec: ColumnConfig<*>,
  columnWidth: (columnConfig: ColumnConfig<*>) => number,
  height: number,
  width?: number | string,
  flexGrow?: number,
  index: ?number,
  parentColumnSpec: ?ColumnContainerConfig<*>,
  onResize?: (resize: { column: ColumnField<*>, width: number }) => *,
  onClick?: (column: ColumnField<*>) => *,
  onSort?: (column: ColumnField<*>) => *,
  resizeable?: boolean,
  headerCellProps?: {|
    renderColumnMenu?: (column: ColumnField<*>) => *,
    onColumnMenuSelect?: (column: ColumnField<*>, value: string) => *
  |}
};

function DataTableHeaderItem({
  columnSpec,
  columnWidth,
  onClick,
  onSort,
  onResize,
  height,
  width,
  flexGrow = 1,
  index,
  parentColumnSpec,
  resizeable,
  headerCellProps
}: DataTableHeaderItemProps) {
  if (columnSpec.type === "stack") {
    return (
      <DataTableHeaderStack
        columnSpec={columnSpec}
        parentColumnSpec={parentColumnSpec}
        index={index}
        onClick={onClick}
        onSort={onSort}
        onResize={onResize}
        height={height}
        width={width}
        flexGrow={flexGrow}
        columnWidth={columnWidth}
        headerCellProps={headerCellProps}
      />
    );
  } else if (columnSpec.type === "group") {
    return (
      <DataTableHeaderGroup
        columnSpec={columnSpec}
        parentColumnSpec={parentColumnSpec}
        index={index}
        onClick={onClick}
        onSort={onSort}
        onResize={onResize}
        height={height}
        width={width}
        flexGrow={flexGrow}
        columnWidth={columnWidth}
        headerCellProps={headerCellProps}
      />
    );
  } else if (columnSpec.type === "field") {
    if (width == null) {
      width = columnWidth(columnSpec);
    }
    if (columnSpec.field.headerCellRenderer) {
      return columnSpec.field.headerCellRenderer({
        column: columnSpec,
        onSort: onSort,
        onClick: onClick ? onClick.bind(null, columnSpec) : onClick,
        style: { width }
      });
    } else {
      return (
        <DataTableHeaderCell
          parentColumn={parentColumnSpec}
          column={columnSpec}
          resizeable={resizeable}
          style={{ width }}
          onClick={onClick}
          onSort={onSort}
          onResize={onResize}
          index={index}
          {...headerCellProps}
        />
      );
    }
  } else {
    return null;
  }
}

class DataTableHeaderStack extends React.Component<*, { resize: ?number }> {
  rootRef: ?HTMLElement = null;

  state = {
    resize: null
  };

  render() {
    const {
      columnSpec,
      columnWidth,
      onClick,
      onSort,
      onResize,
      height,
      flexGrow = 1,
      index,
      parentColumnSpec,
      headerCellProps
    } = this.props;
    const { resize } = this.state;
    const stack = columnSpec.columnList;
    const resizeable =
      index != null && parentColumnSpec != null
        ? parentColumnSpec.columnList.length - 1 !== index
        : true;
    const width = columnWidth(columnSpec);
    return (
      <DataTableHeaderStackRoot
        ref={this.onRootRef}
        height={height * columnSpec.size.height}
        width={width}
        flexGrow={width == null ? flexGrow : undefined}
      >
        {stack.map((c, idx) =>
          c.type === "field" ? (
            <DataTableHeaderGroupRoot
              height={height * c.size.height}
              flexGrow={1}
              width="100%"
              key={idx}
            >
              <DataTableHeaderItem
                onClick={onClick}
                onSort={onSort}
                onResize={onResize}
                height={height}
                width="100%"
                flexGrow={1}
                columnSpec={c}
                parentColumnSpec={columnSpec}
                resizeable={false}
                columnWidth={columnWidth}
                index={idx}
                headerCellProps={headerCellProps}
              />
            </DataTableHeaderGroupRoot>
          ) : (
            <DataTableHeaderItem
              onClick={onClick}
              onSort={onSort}
              onResize={onResize}
              height={height}
              key={idx}
              columnSpec={c}
              parentColumnSpec={columnSpec}
              columnWidth={columnWidth}
              index={idx}
              headerCellProps={headerCellProps}
            />
          )
        )}
        {resizeable && (
          <DataTableHeaderCellResizeHandle
            onMouseDown={this.onMouseDown}
            onClick={stopPropagation}
            style={{ left: resize }}
            variant={{ resize: resize != null }}
          />
        )}
      </DataTableHeaderStackRoot>
    );
  }

  componentWillUnmount() {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
  }

  onRootRef = (rootRef: *) => {
    this.rootRef = findDOMNode(rootRef);
  };

  onMouseDown = (e: MouseEvent) => {
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let resize = Math.max(
        e.clientX - rootRect.left - 1,
        this.props.columnSpec.columnList.length * 50
      );
      window.addEventListener("mousemove", this.onMouseMove);
      window.addEventListener("mouseup", this.onMouseUp);
      this.setState({ resize });
    }
  };

  onMouseUp = (e: MouseEvent) => {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let width = Math.max(
        e.clientX - rootRect.left - 1,
        this.props.columnSpec.columnList.length * 50
      );
      this.setState({ resize: null });
      if (this.props.onResize) {
        let [_, columnSpec] = findRightMostField(this.props.columnSpec);
        if (columnSpec == null) {
          return;
        }
        this.props.onResize({
          column: columnSpec,
          width
        });
      }
    }
  };

  onMouseMove = (e: MouseEvent) => {
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let resize = Math.max(
        e.clientX - rootRect.left - 1,
        this.props.columnSpec.columnList.length * 50
      );
      this.setState({ resize });
    }
  };
}

class DataTableHeaderGroup extends React.Component<*, { resize: ?number }> {
  rootRef: ?HTMLElement = null;

  state = {
    resize: null
  };

  render() {
    const {
      columnSpec,
      parentColumnSpec,
      index,
      onClick,
      onSort,
      onResize,
      height,
      flexGrow,
      columnWidth,
      headerCellProps
    } = this.props;
    const { resize } = this.state;
    const group = columnSpec.columnList;
    const resizeable =
      index != null && parentColumnSpec != null
        ? parentColumnSpec.columnList.length - 1 !== index
        : true;
    const width = columnWidth(columnSpec);
    return (
      <DataTableHeaderGroupRoot
        onClick={stopPropagation}
        ref={this.onRootRef}
        flexGrow={width == null ? flexGrow : undefined}
        width={width}
        height={height * columnSpec.size.height}
      >
        {group.map((c, idx) => (
          <DataTableHeaderItem
            onClick={onClick}
            onSort={onSort}
            onResize={onResize}
            key={idx}
            height={height}
            flexGrow={c.size.width}
            parentColumnSpec={columnSpec}
            columnSpec={c}
            columnWidth={columnWidth}
            index={idx}
            headerCellProps={headerCellProps}
          />
        ))}
        {resizeable && (
          <DataTableHeaderCellResizeHandle
            onMouseDown={this.onMouseDown}
            onClick={stopPropagation}
            style={{ left: resize }}
            variant={{ resize: resize != null }}
          />
        )}
      </DataTableHeaderGroupRoot>
    );
  }

  componentWillUnmount() {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
  }

  onRootRef = rootRef => {
    this.rootRef = findDOMNode(rootRef);
  };

  onMouseDown = (e: MouseEvent) => {
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let resize = Math.max(
        e.clientX - rootRect.left - 1,
        this.props.columnSpec.columnList.length * 50
      );
      window.addEventListener("mousemove", this.onMouseMove);
      window.addEventListener("mouseup", this.onMouseUp);
      this.setState({ resize });
    }
  };

  onMouseUp = (e: MouseEvent) => {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let width = Math.max(
        e.clientX - rootRect.left - 1,
        this.props.columnSpec.columnList.length * 50
      );
      this.setState({ resize: null });
      if (this.props.onResize) {
        let computeColumnWidth = this.props.columnWidth;
        let [headList, columnSpec] = findRightMostField(this.props.columnSpec);
        if (columnSpec == null) {
          return;
        }
        for (let head of headList) {
          let headWidth = computeColumnWidth(head);
          width -= headWidth;
        }
        this.props.onResize({
          column: columnSpec,
          width
        });
      }
    }
  };

  onMouseMove = (e: MouseEvent) => {
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let resize = Math.max(
        e.clientX - rootRect.left - 1,
        this.props.columnSpec.columnList.length * 50
      );
      this.setState({ resize });
    }
  };
}

function findRightMostField(
  columnSpec,
  headList = []
): [Array<ColumnConfig<*>>, ?ColumnField<*>] {
  if (columnSpec.type === "field") {
    return [headList, columnSpec];
  } else if (columnSpec.type === "group") {
    if (columnSpec.columnList.length === 0) {
      return [headList, null];
    } else {
      let length = columnSpec.columnList.length;
      return findRightMostField(
        columnSpec.columnList[length - 1],
        headList.concat(columnSpec.columnList.slice(0, length - 1))
      );
    }
  } else if (columnSpec.type === "stack") {
    if (columnSpec.columnList.length === 0) {
      return [headList, null];
    } else {
      let length = columnSpec.columnList.length;
      return findRightMostField(columnSpec.columnList[length - 1], headList);
    }
  } else {
    throw new Error("invalid column spec");
  }
}

let DataTableHeaderStackRoot = style(VBox, {
  displayName: "DataTableHeaderStackRoot",
  base: {
    height: "100%",
    overflow: "visible"
  }
});

let DataTableHeaderGroupRoot = style(HBox, {
  displayName: "DataTableHeaderGroupRoot",
  base: {
    borderBottom: css.border(1, "#ccc"),
    overflow: "visible"
  }
});

let DataTableHeaderRoot = style("div", {
  displayName: "DataTableHeaderRoot",
  base: {
    marginBottom: 2,
    boxShadow: css.boxShadow(0, 0, 3, 0, "#666"),
    fontSize: "10pt",
    fontWeight: 400,
    color: "#444",
    position: css.position.relative,
    textTransform: css.textTransform.none,

    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    overflow: "visible"
  }
});
