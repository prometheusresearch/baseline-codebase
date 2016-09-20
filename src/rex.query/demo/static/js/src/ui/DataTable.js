/**
 * @flow
 */

import 'react-virtualized/styles.css';

import type {Query} from '../model/Query';
import type {QueryNavigation} from '../model/QueryNavigation';

import React from 'react';
import {
  AutoSizer,
  Column, Table
} from 'react-virtualized';
import {create} from 'react-dom-stylesheet';
import * as css from 'react-dom-stylesheet/css';

import {getQueryNavigation} from '../model/QueryNavigation';

let styles = {};

type DataTableProps = {
  query: Query;
  data: Object;
};

function getColumnList(query) {
  return getColumnListFromNavigation(getQueryNavigation(query), false);
}

function returnRowData({rowData}) {
  return rowData;
}

function returnRowDataByPath({rowData, dataKey}) {
  return rowData != null ? rowData[dataKey] : null;
}

function getColumnListFromNavigation(nav: QueryNavigation, usePath) {
  if (nav.type === 'column') {
    if (nav.query.name === 'aggregate') {
      usePath = false;
    }
    return [
      <Column
        className={cellWrapperClassName}
        headerRenderer={headerRenderer}
        cellRenderer={cellRenderer}
        key={nav.path}
        dataKey={nav.path}
        disableSort={true}
        cellDataGetter={usePath ? returnRowDataByPath : returnRowData}
        label={nav.title}
        width={90}
        />
    ];
  } else if (nav.type === 'select') {
    return nav.select
      .map(nav => getColumnListFromNavigation(nav, true))
      .reduce((list, c) => list.concat(c), []);
  } else if (nav.type === 'navigate') {
    if (nav.navigate.length === 0) {
      return [];
    } else {
      let navigate = nav.navigate.slice();
      let last = navigate.pop();
      return getColumnListFromNavigation(last, usePath || false);
    }
  }
}

export class DataTable extends React.Component<*, DataTableProps, *> {

  render () {
    let {query} = this.props;
    let columnList = getColumnList(query);

    return (
      <AutoSizer>
        {size => (
          <Table
            gridClassName={gridClassName}
            headerClassName={headerCellWrapperClassName}
            rowClassName={getRowClassName}
            headerHeight={40}
            noRowsRenderer={this._noRowsRenderer}
            overscanRowCount={10}
            rowHeight={35}
            rowGetter={this._getDatum}
            rowCount={10}
            height={size.height}
            width={size.width}>
            {columnList}
          </Table>
        )}
      </AutoSizer>
    )
  }

  _getData() {
    let {data, query} = this.props;
    let nav = getQueryNavigation(query);
    if (nav.type === 'navigate') {
      for (let i = nav.navigate.length - 1; i >= 0; i--) {
        if (nav.navigate[i].type === 'column') {
          data = data[nav.navigate[i].path];
          break;
        }
      }
    } else if (nav.type === 'select') {
      // TODO: handle record on the top level
    } else if (nav.type === 'column') {
      // TODO: handle scalar
    }
    return Array.isArray(data) ? data : [data];
  }

  _getDatum = ({index}: {index: number}) => {
    let data = this._getData();
    return data[index];
  };

  _noRowsRenderer = () => {
    return (
      <div className={styles.noRows}>
        No data
      </div>
    )
  };

}

function defineClass(className: string, stylesheet: Object): string {
  let style = create(stylesheet, className);
  style.use();
  return style.asClassName();
}

function getRowClassName({index}: {index: number}) {
  if (index === -1) {
    return headerRowClassName;
  } else {
    return rowClassName;
  }
}

let headerRowClassName = defineClass('DataTableHeaderRow', {
  borderBottom: css.border(1, '#ccc'),
  boxShadow: css.boxShadow(0, 2, 0, 0, '#eee'),
  position: css.position.relative,
  textTransform: css.textTransform.none,
  fontWeight: 500,
  fontSize: '11pt',
  zIndex: 1000,
});

let headerCellWrapperClassName = defineClass('DataTableHeaderCellWrapper', {
  height: '100%',

  paddingRight: 10,
  paddingLeft: 10,

  marginRight: 0,
  firstOfType: {
    marginLeft: 0,
  },
});

let headerCellClassName = defineClass('DataTableHeaderCell', {
  display: css.display.inlineBlock,
  maxWidth: '100%',
  whiteSpace: css.whiteSpace.nowrap,
  textOverflow: css.textOverflow.ellipsis,
  overflow: css.overflow.hidden,
  position: css.position.absolute,
  bottom: 5,
});

let rowClassName = defineClass('DataTableRow', {
  fontSize: '11pt',
  borderBottom: css.border(1, '#eee'),
  hover: {
    background: '#fafafa',
  }
});

let cellWrapperClassName = defineClass('DataTableCellWrapper', {
  paddingRight: 10,
  paddingLeft: 10,

  marginRight: 0,
  firstOfType: {
    marginLeft: 0,
  },
});

let gridClassName = defineClass('DataTableGrid', {
  outline: css.none,
});

function headerRenderer({
  columnData,
  dataKey,
  disableSort,
  label,
  sortBy,
  sortDirection
}) {
  const showSortIndicator = sortBy === dataKey;
  return (
    <span
      className={headerCellClassName}
      key="label"
      title={label}>
      {label}
    </span>
  );
}

function cellRenderer({
  cellData
}): string {
  if (cellData == null) {
    return ''
  } else if (cellData === true) {
    return '✓';
  } else if (cellData === false) {
    return '✗';
  } else {
    return String(cellData)
  }
}
