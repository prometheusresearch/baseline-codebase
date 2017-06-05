/**
 * @flow
 */

import type {ColumnField} from './DataTable';
import type {ColumnSpecData} from '../DataTable';
import type {Actions} from '../../state';

import * as React from 'react';
import * as Icon from '../../ui/Icon';
import {style, Element, HBox} from 'react-stylesheet';
import * as MenuButton from 'react-aria-menubutton';
import RelativePortal from 'react-relative-portal';

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

export default class DataTableHeaderCellMenu extends React.Component {
  props: {
    column: ColumnField<ColumnSpecData>,
    onSort: () => void,
  };

  context: {
    actions: Actions,
  };

  static contextTypes = {actions: React.PropTypes.object};

  onMenuSelect = (value: string) => {
    const {pipeline, navigate} = this.props.column.field.data;
    if (navigate == null) {
      return;
    }
    switch (value) {
      case 'hide': {
        this.context.actions.cut({at: navigate});
        break;
      }
      case 'link': {
        this.context.actions.appendDefine({
          at: pipeline,
          path: [navigate.path],
        });
        break;
      }
      case 'sort': {
        this.props.onSort();
        break;
      }
      case 'goto': {
        this.context.actions.appendNavigate({
          at: pipeline,
          path: [navigate.path],
        });
        break;
      }
      default:
        break;
    }
  };

  render() {
    const {column} = this.props;
    return (
      <MenuButton.Wrapper
        tag={DataTableHeaderCellMenuRoot}
        onSelection={this.onMenuSelect}>
        <MenuButton.Button tag={Icon.IconEllipsis} />
        <DropdownMenu>
          <DropdownMenuItem value="hide">Remove column</DropdownMenuItem>
          <DropdownMenuItem value="goto">Follow column</DropdownMenuItem>
          <DropdownMenuItem value="link">Link as a query</DropdownMenuItem>
          {column.field.sort !== false &&
            <DropdownMenuItem value="sort">
              {column.field.sort === 'asc' ? 'Sort desceding' : 'Sort asceding'}
            </DropdownMenuItem>}
        </DropdownMenu>
      </MenuButton.Wrapper>
    );
  }
}
