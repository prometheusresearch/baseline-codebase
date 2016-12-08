/**
 * @flow
 **/

import type {
  ColumnConfig,
  ColumnField,
  ColumnContainerConfig
} from './DataTable';

import ReactDOM from 'react-dom'
import React from 'react'
import {VBox, HBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';
import * as css from 'react-stylesheet/css';

import stopPropagation from '../../stopPropagation';
import computeColumnStyle from './computeColumnStyle';
import DataTableHeaderCell, {
  DataTableHeaderCellResizeHandle
} from './DataTableHeaderCell';

type DataTableHeaderProps = {
  columns: ColumnConfig<*>;
  columnWidthByID: {[dataKey: string]: number};
  height: number;
  width: number;
  scrollbarWidth: number;
  onColumnResize?: (resize: {id: string; width: number}) => *;
  onColumnClick?: (column: ColumnField<*>) => *;
};

export default function DataTableHeader(props: DataTableHeaderProps) {
  let {
    width, height,
    scrollbarWidth,
    onColumnClick, onColumnResize,
    columns, columnWidthByID,
  } = props;
  return (
    <DataTableHeaderRoot
      style={{
        height: height * columns.size.height,
        width,
        paddingRight: scrollbarWidth,
      }}>
      <DataTableHeaderItem
        columnSpec={columns}
        parentColumnSpec={null}
        index={null}
        columnWidthByID={columnWidthByID}
        height={height}
        onClick={onColumnClick}
        onResize={onColumnResize}
        />
    </DataTableHeaderRoot>
  );
}

type DataTableHeaderItemProps = {
  columnSpec: ColumnConfig<*>;
  columnWidthByID: {[id: string]: number};
  height: number;
  grow?: number;
  index: ?number;
  parentColumnSpec: ?ColumnContainerConfig<*>;
  onResize?: (resize: {id: string; width: number}) => *;
  onClick?: (column: ColumnField<*>) => *;
  resizeable?: boolean;
};

function DataTableHeaderItem({
  columnSpec, columnWidthByID,
  onClick, onResize,
  height, grow = 1,
  index, parentColumnSpec,
  resizeable,
}: DataTableHeaderItemProps) {
  if (columnSpec.type === 'stack') {
    return (
      <DataTableHeaderStack
        columnSpec={columnSpec}
        parentColumnSpec={parentColumnSpec}
        index={index}
        onClick={onClick}
        onResize={onResize}
        height={height}
        grow={grow}
        columnWidthByID={columnWidthByID}
        />
    );
  } else if (columnSpec.type === 'group') {
    return (
      <DataTableHeaderGroup
        columnSpec={columnSpec}
        parentColumnSpec={parentColumnSpec}
        index={index}
        onClick={onClick}
        onResize={onResize}
        height={height}
        grow={grow}
        columnWidthByID={columnWidthByID}
        />
    );
  } else if (columnSpec.type === 'field') {
    let id = columnSpec.id;
    let width = columnWidthByID[id];
    const style = computeColumnStyle(columnSpec.field, {
      flexGrow: grow,
      width,
    })
    if (columnSpec.field.headerCellRenderer) {
      return columnSpec.field.headerCellRenderer({
        column: columnSpec,
        onClick: onClick ? onClick.bind(null, columnSpec) : onClick,
        style: style,
      });
    } else {
      return (
        <DataTableHeaderCell
          parentColumn={parentColumnSpec}
          column={columnSpec}
          resizeable={resizeable}
          style={style}
          onClick={onClick}
          onResize={onResize}
          index={index}
          />
      );
    }
  }

}

class DataTableHeaderStack extends React.Component {

  rootRef: ?HTMLElement = null;

  state: {
    resize: ?number;
  } = {
    resize: null,
  };

  render() {
    const {
      columnSpec,
      columnWidthByID,
      onClick,
      onResize,
      height,
      grow = 1,
      index,
      parentColumnSpec,
    } = this.props;
    const {
      resize,
    } = this.state;
    const stack = columnSpec.columnList;
    const resizeable = index != null && parentColumnSpec != null
      ? parentColumnSpec.columnList.length - 1 !== index
      : true;
    const width = columnWidthByID[columnSpec.id];
    return (
      <DataTableHeaderStackRoot
        ref={this.onRootRef}
        height={height * columnSpec.size.height}
        width={width}
        grow={width == null ? grow : undefined}>
        {stack.map((c, idx) =>
          c.type === 'field' ?
          <DataTableHeaderGroupRoot
            height={height * c.size.height}
            grow={1}
            width="100%"
            key={idx}>
            <DataTableHeaderItem
              onClick={onClick}
              onResize={onResize}
              height={height}
              flexGrow={1}
              columnSpec={c}
              parentColumnSpec={columnSpec}
              resizeable={false}
              columnWidthByID={columnWidthByID}
              index={idx}
              />
          </DataTableHeaderGroupRoot> :
          <DataTableHeaderItem
            onClick={onClick}
            onResize={onResize}
            height={height}
            key={idx}
            columnSpec={c}
            parentColumnSpec={columnSpec}
            columnWidthByID={columnWidthByID}
            index={idx}
            />)}
        {resizeable &&
          <DataTableHeaderCellResizeHandle
            onMouseDown={this.onMouseDown}
            onClick={stopPropagation}
            style={{left: resize}}
            variant={{resize: resize != null}}
            />}
      </DataTableHeaderStackRoot>
    );
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  onRootRef = (rootRef: React.Component<*, *, *>) => {
    this.rootRef = ReactDOM.findDOMNode(rootRef);
  };

  onMouseDown = (e: MouseEvent) => {
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let resize = Math.max(
        e.clientX - rootRect.left - 1,
        this.props.columnSpec.columnList.length * 50
      );
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
      this.setState({resize});
    }
  };

  onMouseUp = (e: MouseEvent) => {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let width = Math.max(
        e.clientX - rootRect.left - 1,
        this.props.columnSpec.columnList.length * 50
      );
      this.setState({resize: null});
      if (this.props.onResize) {
        this.props.onResize({
          id: this.props.columnSpec.id,
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
      this.setState({resize});
    }
  };
}

class DataTableHeaderGroup extends React.Component {

  rootRef: ?HTMLElement = null;

  state: {
    resize: ?number;
  } = {
    resize: null,
  };

  render() {
    const {
      columnSpec,
      parentColumnSpec, index,
      onClick, onResize,
      height, grow,
      columnWidthByID,
    } = this.props;
    const {
      resize
    } = this.state;
    const group = columnSpec.columnList;
    const resizeable = index != null && parentColumnSpec != null
      ? parentColumnSpec.columnList.length - 1 !== index
      : true;
    const width = columnWidthByID[columnSpec.id];
    return (
      <DataTableHeaderGroupRoot
        onClick={stopPropagation}
        ref={this.onRootRef}
        grow={width == null ? grow : undefined}
        width={width}
        height={height * columnSpec.size.height}>
        {group.map((c, idx) =>
          <DataTableHeaderItem
            onClick={onClick}
            onResize={onResize}
            key={idx}
            height={height}
            grow={c.size.width}
            parentColumnSpec={columnSpec}
            columnSpec={c}
            columnWidthByID={columnWidthByID}
            index={idx}
            />)}
        {resizeable &&
          <DataTableHeaderCellResizeHandle
            onMouseDown={this.onMouseDown}
            onClick={stopPropagation}
            style={{left: resize}}
            variant={{resize: resize != null}}
            />}
      </DataTableHeaderGroupRoot>
    );
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  onRootRef = (rootRef: React.Component<*, *, *>) => {
    this.rootRef = ReactDOM.findDOMNode(rootRef);
  };

  onMouseDown = (e: MouseEvent) => {
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let resize = Math.max(
        e.clientX - rootRect.left - 1,
        this.props.columnSpec.columnList.length * 50
      );
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
      this.setState({resize});
    }
  };

  onMouseUp = (e: MouseEvent) => {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let width = Math.max(
        e.clientX - rootRect.left - 1,
        this.props.columnSpec.columnList.length * 50
      );
      this.setState({resize: null});
      if (this.props.onResize) {
        this.props.onResize({
          id: this.props.columnSpec.id,
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
      this.setState({resize});
    }
  };
}

let DataTableHeaderStackRoot = style(VBox, {
  displayName: 'DataTableHeaderStackRoot',
  base: {
    height: '100%',
    overflow: 'visible',
  }
});

let DataTableHeaderGroupRoot = style(HBox, {
  displayName: 'DataTableHeaderGroupRoot',
  base: {
    borderBottom: css.border(1, '#ccc'),
    overflow: 'visible',
  }
});

let DataTableHeaderRoot = style('div', {
  displayName: 'DataTableHeaderRoot',
  base: {
    marginBottom: 2,
    boxShadow: css.boxShadow(0, 0, 3, 0, '#666'),
    fontSize: '10pt',
    fontWeight: 400,
    color: '#444',
    position: css.position.relative,
    textTransform: css.textTransform.none,

    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  }
});

