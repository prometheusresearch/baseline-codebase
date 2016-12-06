/**
 * @flow
 */

import type {ColumnField} from './DataTable';

import React from 'react'
import ReactDOM from 'react-dom'
import {HBox} from '@prometheusresearch/react-box';
import EllipsisIcon from 'react-icons/lib/fa/ellipsis-v';
import {style} from 'react-stylesheet';
import * as css from 'react-stylesheet/css';

function stopPropagation(e: UIEvent) {
  e.stopPropagation();
}

type DataTableHeaderCellProps = {
  column: ColumnField<*>;
  onClick?: (column: ColumnField<*>) => *;
  onResize?: (resize: {dataKey: Array<string>; width: number}) => *;
  style: Object;
};

export default class DataTableHeaderCell extends React.Component {

  props: DataTableHeaderCellProps;

  state: {
    resize: ?number;
  } = {
    resize: null,
  };

  rootRef: ?HTMLElement = null;

  render() {
    const {column, onClick, style} = this.props;
    const {resize} = this.state;
    return (
      <DataTableHeaderCellRoot
        ref={this.onRootRef}
        style={style}
        onClick={onClick}>
        <DataTableHeaderCellLabel title={column.field.label}>
          {column.field.label}
        </DataTableHeaderCellLabel>
        <DataTableHeaderCellMenu>
          <EllipsisIcon />
        </DataTableHeaderCellMenu>
        <DataTableHeaderCellResizeHandle
          onMouseDown={this.onMouseDown}
          onClick={stopPropagation}
          style={{left: resize}}
          variant={{resize: resize != null}}
          />
      </DataTableHeaderCellRoot>
    );
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  onRootRef = (rootRef: React.Component<*, *, *>) => {
    this.rootRef = ReactDOM.findDOMNode(rootRef);
  };

  onClick = () => {
    if (this.props.onClick) {
      this.props.onClick(this.props.column);
    }
  };

  onMouseDown = (e: MouseEvent) => {
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let left = e.clientX - rootRect.left - 1;
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
      let width = e.clientX - rootRect.left - 1;
      this.setState({resize: null});
      if (this.props.onResize) {
        this.props.onResize({
          dataKey: this.props.column.field.dataKey,
          width
        });
      }
    }
  };

  onMouseMove = (e: MouseEvent) => {
    if (this.rootRef != null) {
      let rootRect = this.rootRef.getBoundingClientRect();
      let left = e.clientX - rootRect.left - 1;
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
  }
});

export let DataTableHeaderCellLabel = style('span', {
  displayName: 'DataTableHeaderCellLabel',
  base: {
    userSelect: 'none',
    textTransform: 'capitalize',
    cursor: 'default',
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

export let DataTableHeaderCellMenu = style(HBox, {
  base: {
    color: '#ccc',
    cursor: 'pointer',

    position: 'absolute',
    bottom: 7,
    right: 4,

    hover: {
      color: 'currentColor',
    }
  }
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
    }
  },
  resize: {
    background: '#222',
    width: 3,
    zIndex: 1000,
    hover: {
      background: '#222',
    },
  }
});
