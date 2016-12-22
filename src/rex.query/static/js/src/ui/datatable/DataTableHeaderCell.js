/**
 * @flow
 */

import type {ColumnField, ColumnContainerConfig} from './DataTable';
import type {Actions} from '../../state';

import React from 'react'
import ReactDOM from 'react-dom'
import EllipsisIcon from 'react-icons/lib/fa/ellipsis-v';
import {style, css, Element, HBox} from 'react-stylesheet';
import stopPropagation from '../../stopPropagation';
import * as MenuButton from 'react-aria-menubutton';
import RelativePortal from 'react-relative-portal';

let DataTableHeaderCellMenuRoot = style(HBox, {
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

function DropdownMenu({children}) {
  let border = {width: 1, style: 'solid', color: '#cccccc'};
  let boxShadow = {x: 0, y: 0, blur: 3, spread: 1, color: '#eeeeee'};
  return (
    <RelativePortal right={0} top={-6}>
      <MenuButton.Menu>
        <Element>
          <Element
            borderBottom={border}
            textAlign="right">
            <Element
              position="relative"
              top={1}
              background="#ffffff"
              borderTop={border}
              borderLeft={border}
              borderRight={border}
              display="inline-block"
              fontSize="80%">
              <EllipsisIcon />
            </Element>
          </Element>
          <Element
            boxShadow={boxShadow}
            background="#ffffff"
            borderRight={border}
            borderLeft={border}
            borderBottom={border}>
            {children}
          </Element>
        </Element>
      </MenuButton.Menu>
    </RelativePortal>
  );
}

function DropdownMenuItem({value, children}) {
  return (
    <Element
      padding={{vertical: 7, horizontal: 12}}
      fontWeight={200}
      fontSize="80%"
      background="#ffffff"
      backgroundOnHover="#fafafa"
      cursor="default"
      color="#666666"
      colorOnHover="#444444">
      <MenuButton.MenuItem value={value}>{children}</MenuButton.MenuItem>
    </Element>
  );
}

class DataTableHeaderCellMenu extends React.Component {

  context: {
    actions: Actions;
  };

  static contextTypes = {actions: React.PropTypes.object};

  onMenuSelect = (value) => {

  };

  render() {
    return (
      <MenuButton.Wrapper tag={DataTableHeaderCellMenuRoot} onSelection={this.onMenuSelect}>
        <MenuButton.Button tag={EllipsisIcon} />
        <DropdownMenu>
          <DropdownMenuItem value="hide">Hide column</DropdownMenuItem>
          <DropdownMenuItem value="goto">Follow column</DropdownMenuItem>
          <DropdownMenuItem value="summarize">Summarize column</DropdownMenuItem>
        </DropdownMenu>
      </MenuButton.Wrapper>
    );
  }
}

type DataTableHeaderCellProps = {
  column: ColumnField<*>;
  parentColumn: ?ColumnContainerConfig<*>;
  index: ?number;
  onClick?: (column: ColumnField<*>) => *;
  onResize?: (resize: {column: ColumnField<*>; width: number}) => *;
  style: Object;
  minColumnWidth: number;
  resizeable?: boolean;
};

export default class DataTableHeaderCell extends React.Component {

  static defaultProps = {
    minColumnWidth: 70,
  };

  props: DataTableHeaderCellProps;

  state: {
    resize: ?number;
  } = {
    resize: null,
  };

  rootRef: ?HTMLElement = null;

  render() {
    let {
      column, onClick,
      style, index,
      parentColumn, resizeable
    } = this.props;
    const {resize} = this.state;
    if (resizeable == null) {
      resizeable = index != null && parentColumn != null
        ? parentColumn.columnList.length - 1 !== index
        : true;
    }
    return (
      <DataTableHeaderCellRoot
        ref={this.onRootRef}
        style={style}
        onClick={onClick}>
        <DataTableHeaderCellLabel title={column.field.label}>
          {column.field.label}
        </DataTableHeaderCellLabel>
        <DataTableHeaderCellMenu />
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

  onClick = () => {
    if (this.props.onClick) {
      this.props.onClick(this.props.column);
    }
  };

  onRootRef = (rootRef: React.Component<*, *, *>) => {
    this.rootRef = ReactDOM.findDOMNode(rootRef);
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
          width
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
  }
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
    height: 100000,
    hover: {
      background: '#222',
    },
  }
});
