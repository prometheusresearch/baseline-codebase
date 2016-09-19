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
    return [
      <Column
        dataKey={nav.query.path}
        disableSort={true}
        cellDataGetter={usePath ? returnRowDataByPath : returnRowData}
        label={nav.query.path}
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
            headerClassName={styles.headerColumn}
            headerHeight={30}
            noRowsRenderer={this._noRowsRenderer}
            overscanRowCount={10}
            rowHeight={35}
            rowGetter={this._getDatum}
            rowCount={1000}
            height={size.height}
            width={size.width}>
            {columnList}
          </Table>
        )}
      </AutoSizer>
    )
  }

  _getDatum = ({index}: {index: number}) => {
    let {data, query} = this.props;
    let nav = getQueryNavigation(query);
    if (nav.type === 'navigate') {
      for (let i = nav.navigate.length - 1; i >= 0; i--) {
        if (nav.navigate[i].type === 'column') {
          data = data[nav.navigate[i].query.path];
          break;
        }
      }
    } else if (nav.type === 'select') {
      // TODO: handle record on the top level
    } else if (nav.type === 'column') {
      // TODO: handle scalar
    }
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
