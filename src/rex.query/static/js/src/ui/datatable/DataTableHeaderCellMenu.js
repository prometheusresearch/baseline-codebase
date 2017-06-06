/**
 * @flow
 */

import type {ColumnField} from './DataTable';

import * as React from 'react';
import {style, Element, HBox} from 'react-stylesheet';
import * as MenuButton from 'react-aria-menubutton';
import RelativePortal from 'react-relative-portal';

import * as Icon from '../../ui/Icon';
import stopPropagation from '../../stopPropagation';

export let DataTableHeaderCellMenuRoot = style(HBox, {
  base: {
    color: '#ccc',
    cursor: 'pointer',

    position: 'absolute',
    bottom: 7,
    right: 4,

    hover: {
      color: 'currentColor',
    },
  },
});

function DropdownMenu({children}) {
  let border = {width: 1, style: 'solid', color: '#cccccc'};
  let boxShadow = {x: 0, y: 0, blur: 3, spread: 1, color: '#eeeeee'};
  return (
    <RelativePortal right={0} top={-6}>
      <MenuButton.Menu>
        <Element>
          <Element borderBottom={border} textAlign="right">
            <Element
              position="relative"
              top={1}
              background="#ffffff"
              borderTop={border}
              borderLeft={border}
              borderRight={border}
              display="inline-block"
              fontSize="80%">
              <Icon.IconEllipsis />
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

export function DropdownMenuItem({
  value,
  children,
}: {
  value: string,
  children: React.Element<*>,
}) {
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

export default class DataTableHeaderCellMenu extends React.Component {
  props: {
    column: ColumnField<*>,

    renderItems: (column: ColumnField<*>) => *,
    onSelect?: (column: ColumnField<*>, value: string) => *,
  };

  onMenuSelect = (value: string) => {
    if (this.props.onSelect) {
      this.props.onSelect(this.props.column, value);
    }
  };

  render() {
    const {column, renderItems} = this.props;
    return (
      <MenuButton.Wrapper
        tag={DataTableHeaderCellMenuRoot}
        onClick={stopPropagation}
        onSelection={this.onMenuSelect}>
        <MenuButton.Button tag={Icon.IconEllipsis} />
        <DropdownMenu>
          {renderItems(column)}
        </DropdownMenu>
      </MenuButton.Wrapper>
    );
  }
}
