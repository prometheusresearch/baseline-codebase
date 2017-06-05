/**
 * @flow
 */

import type {ColumnField, ColumnContainerConfig} from './DataTable';

import React from 'react';
import {style, css} from 'react-stylesheet';
import * as Icon from '../../ui/Icon';
import findDOMNode from '../../findDOMNode';
import stopPropagation from '../../stopPropagation';
import {DataTableHeaderCellMenuRoot} from './DataTableHeaderCellMenu';
import DataTableHeaderCellMenu from './DataTableHeaderCellMenu';

type DataTableHeaderCellProps = {
  column: ColumnField<*>,
  parentColumn: ?ColumnContainerConfig<*>,
  index: ?number,
  onClick?: (column: ColumnField<*>) => *,
  onSort?: (column: ColumnField<*>) => *,
  onResize?: (resize: {column: ColumnField<*>, width: number}) => *,
  style: Object,
  minColumnWidth: number,
  resizeable?: boolean,
};

export default class DataTableHeaderCell extends React.Component {
  static defaultProps = {
    minColumnWidth: 70,
  };

  props: DataTableHeaderCellProps;

  state: {
    resize: ?number,
  } = {
    resize: null,
  };

  rootRef: ?HTMLElement = null;

  render() {
    let {column, onClick, style, index, parentColumn, resizeable} = this.props;
    const {resize} = this.state;
    if (resizeable == null) {
      resizeable = index != null && parentColumn != null
        ? parentColumn.columnList.length - 1 !== index
        : true;
    }
    return (
      <DataTableHeaderCellRoot ref={this.onRootRef} style={style} onClick={onClick}>
        <DataTableHeaderCellLabel title={column.field.label}>
          {column.field.label}
        </DataTableHeaderCellLabel>
        {column.field.sort !== false &&
          <DataTableHeaderCellMenuRoot
            style={{right: 15}}
            onClick={this.onSort}
            title="Click to sort the table by this column">
            {column.field.sort === 'asc'
              ? <Icon.IconSortAsc />
              : column.field.sort === 'desc' ? <Icon.IconSortDesc /> : <Icon.IconBars />}
          </DataTableHeaderCellMenuRoot>}
        <DataTableHeaderCellMenu column={column} onSort={this.onSort} />
        {resizeable &&
          <DataTableHeaderCellResizeHandle
            onMouseDown={this.onMouseDown}
            onClick={stopPropagation}
            style={{left: resize}}
            variant={{resize: resize != null}}
          />}
      </DataTableHeaderCellRoot>
    );
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  onSort = (e?: UIEvent) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (this.props.onSort) {
      this.props.onSort(this.props.column);
    }
  };

  onClick = () => {
    if (this.props.onClick) {
      this.props.onClick(this.props.column);
    }
  };

  onRootRef = (rootRef: React.Component<*, *, *>) => {
    this.rootRef = findDOMNode(rootRef);
  };

  onMouseDown = (e: MouseEvent) => {
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let left = Math.max(e.clientX - rootRect.left - 1, this.props.minColumnWidth);
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
      this.setState({resize: left});
    }
  };

  onMouseUp = (e: MouseEvent) => {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let width = Math.max(e.clientX - rootRect.left - 1, this.props.minColumnWidth);
      this.setState({resize: null});
      if (this.props.onResize) {
        this.props.onResize({
          column: this.props.column,
          width,
        });
      }
    }
  };

  onMouseMove = (e: MouseEvent) => {
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let left = Math.max(e.clientX - rootRect.left - 1, this.props.minColumnWidth);
      this.setState({resize: left});
    }
  };
}

export let DataTableHeaderCellRoot = style('div', {
  displayName: 'DataTableHeaderCellRoot',
  base: {
    position: 'relative',
    minWidth: 0,

    paddingRight: 10,
    paddingLeft: 10,

    borderRight: css.border(1, '#ccc'),
  },
});

export let DataTableHeaderCellLabel = style('span', {
  displayName: 'DataTableHeaderCellLabel',
  base: {
    userSelect: 'none',
    cursor: 'default',
    display: css.display.inlineBlock,
    maxWidth: '100%',
    textTransform: css.textTransform.uppercase,
    fontSize: '10px',
    fontWeight: 400,
    color: '#888888',
    whiteSpace: css.whiteSpace.nowrap,
    textOverflow: css.textOverflow.ellipsis,
    overflow: css.overflow.hidden,
    position: css.position.absolute,
    bottom: 8,
    paddingRight: 20,
  },
});

export let DataTableHeaderCellResizeHandle = style('div', {
  displayName: 'DataTableHeaderCellResizeHandle',
  base: {
    cursor: 'ew-resize',
    background: '#f1f1f1',

    height: '100%',
    width: 3,
    right: 0,
    position: 'absolute',

    hover: {
      background: '#888',
    },
  },
  resize: {
    background: '#222',
    width: 3,
    zIndex: 1000,
    height: 100000,
    hover: {
      background: '#222',
    },
  },
});
