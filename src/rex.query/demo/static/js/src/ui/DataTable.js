/**
 * @flow
 */

import 'react-virtualized/styles.css';

import type {Query} from '../model/Query';
import type {QueryNavigation} from '../model/QueryNavigation';

import React from 'react';
import {
  AutoSizer,
  FlexColumn, FlexTable,
  SortDirection, SortIndicator
} from 'react-virtualized';

import {getQueryNavigation} from '../model/QueryNavigation';

let styles = {};

type DataTableProps = {
  query: Query;
};

function getColumnList(query) {
  return getColumnListFromNavigation(getQueryNavigation(query), []);
}

function getColumnListFromNavigation(nav: QueryNavigation, keyPath) {
  if (nav.type === 'column') {
    keyPath = keyPath.concat(nav.query.path);
    console.log(keyPath);
    return [
      <FlexColumn
        dataKey={keyPath.join('.')}
        disableSort={true}
        cellDataGetter={() => 'ok'}
        label={keyPath.join('.')}
        width={90}
        />
    ];
  } else if (nav.type === 'select') {
    return nav.select
      .map(nav => getColumnListFromNavigation(nav, keyPath))
      .reduce((list, c) => list.concat(c), []);
  } else if (nav.type === 'navigate') {
    if (nav.navigate.length === 0) {
      return [];
    } else {
      let navigate = nav.navigate.slice();
      let last = navigate.pop();
      return getColumnListFromNavigation(
        last, navigate
          .map(n => n.type === 'column' ? n.query.path : null)
          .filter(Boolean)
      );
    }
  }
}

export class DataTable extends React.Component<*, DataTableProps, *> {

  render () {
    let {query} = this.props;
    let columnList = getColumnList(query);
    console.log(columnList.map(c => c.props));

    return (
      <AutoSizer>
        {size => (
          <FlexTable
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
          </FlexTable>
        )}
      </AutoSizer>
    )
  }

  _getDatum = ({index}: {index: number}) => {
    let {data, query} = this.props;
    let nav = getQueryNavigation(query);
    if (nav.type === 'navigate' && nav.navigate.length > 1) {
      data = data[nav.navigate[0].query.path];
    }
    console.log(data);
    return data;
  };

  _noRowsRenderer = () => {
    return (
      <div className={styles.noRows}>
        No data
      </div>
    )
  };

}
